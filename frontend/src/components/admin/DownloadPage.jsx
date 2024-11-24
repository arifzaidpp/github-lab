import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Select from 'react-select';
import { Download, FileSpreadsheet, File, Loader, FileText } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    HeadingLevel,
    AlignmentType
} from 'docx';
import { UsersPdfDocument } from './UsersPdfDocument';

export default function DownloadPage({ users }) {
    const [selectedClass, setSelectedClass] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState('pdf');
    const [isBrief, setIsBrief] = useState();

    const classOptions = [
        { value: "all", label: "All Classes" },
        ...Array.from(new Set(users.map(user => user.class))).map(className => ({
            value: className,
            label: className,
        }))
    ];

    const formatOptions = [
        { value: 'pdf', label: 'PDF', icon: File },
        { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
        { value: 'word', label: 'Word', icon: FileText }
    ];

    const createTableForClass = (classUsers, className) => {
        return [
            // Class Heading
            new Paragraph({
                text: `Class ${className}`,
                heading: HeadingLevel.HEADING_2,
                spacing: {
                    before: 400,
                    after: 200
                }
            }),
            // Table for the class
            new Table({
                width: {
                    size: 100,
                    type: 'pct',
                },
                rows: [
                    // Header Row
                    new TableRow({
                        tableHeader: true,
                        children: [
                            'Ad. No.',
                            'Name',
                            'Credit',
                            'Usage Fee',
                            'Balance'
                        ].map(header =>
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({
                                        text: header,
                                        bold: true
                                    })],
                                    alignment: AlignmentType.CENTER
                                })],
                                shading: {
                                    fill: "E8E8E8",
                                }
                            })
                        ),
                    }),
                    // Data Rows
                    ...classUsers.map(user =>
                        new TableRow({
                            children: [
                                user.admissionNumber.toString(),
                                user.name,
                                user.creditBalance.toFixed(2),
                                user.totalUsageFee.toFixed(2),
                                user.netBalance.toFixed(2)
                            ].map(cellData =>
                                new TableCell({
                                    children: [new Paragraph({
                                        text: cellData,
                                        alignment: AlignmentType.CENTER
                                    })]
                                })
                            ),
                        })
                    ),
                ],
            }),
            // Summary Row for the class
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Total Students: ${classUsers.length}`,
                        bold: true
                    })
                ],
                spacing: {
                    before: 200,
                    after: 400
                }
            })
        ];
    };

    const downloadData = async () => {
        if (!selectedClass) {
            alert('Please select a class');
            return;
        }

        setIsLoading(true);

        try {
            const filteredUsers = selectedClass.value === 'all'
                ? users
                : users.filter(user => user.class === selectedClass.value);

            if (filteredUsers.length === 0) {
                alert('No users found');
                setIsLoading(false);
                return;
            }

            const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
            const fileName = `users_balance_${selectedClass.value}_${timestamp}`;

            if (downloadFormat === 'pdf') {
                const doc = (
                    <UsersPdfDocument
                        users={filteredUsers}
                        className={selectedClass.value === 'all' ? 'All Classes' : selectedClass.value}
                        isBrief={isBrief}
                    />
                );
                const blob = await pdf(doc).toBlob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}.pdf`;
                link.click();
                URL.revokeObjectURL(url);
            } else if (downloadFormat === 'excel') {
                const worksheet = XLSX.utils.json_to_sheet(filteredUsers.map(user => ({
                    'Ad. No.': user.admissionNumber,
                    'Class': user.class,
                    'Name': user.name,
                    'Usage': (() => {
                        const hours = Math.floor(user.totalUsage / 3600000);
                        const minutes = Math.floor((user.totalUsage % 3600000) / 60000);
                        const seconds = Math.floor((user.totalUsage % 60000) / 1000);
                        return hours > 0
                            ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} hrs`
                            : `${minutes}:${seconds.toString().padStart(2, "0")} mins`;
                    })(),
                    'Usage Fee': user.totalUsageFee,
                    'Credit': user.creditBalance,
                    'Balance': user.netBalance
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'User Data');
                XLSX.writeFile(workbook, `${fileName}.xlsx`);
            } else if (downloadFormat === 'word') {
                // Group users by class and sort them
                const groupedByClass = filteredUsers.reduce((acc, user) => {
                    if (!acc[user.class]) acc[user.class] = [];
                    acc[user.class].push(user);
                    return acc;
                }, {});

                // Sort classes
                const sortedClasses = Object.keys(groupedByClass).sort();

                // Create document content
                const docChildren = [
                    // Title
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Users Balance Report",
                                bold: true,
                                size: 32
                            })
                        ],
                        spacing: {
                            after: 300
                        },
                        alignment: AlignmentType.CENTER
                    }),
                    // Subtitle with date
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Generated on: ${format(new Date(), 'PPpp')}`,
                                italics: true
                            })
                        ],
                        spacing: {
                            after: 400
                        },
                        alignment: AlignmentType.CENTER
                    })
                ];

                // Add tables for each class
                sortedClasses.forEach(className => {
                    const classContent = createTableForClass(groupedByClass[className], className);
                    docChildren.push(...classContent);
                });

                // Create the document
                const doc = new Document({
                    sections: [{
                        properties: {},
                        children: docChildren
                    }],
                });

                const blob = await Packer.toBlob(doc);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}.docx`;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading data:', error);
            alert('Error downloading data. Please try again.');
        }

        setIsLoading(false);
    };

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-blue-900/50 rounded-2xl p-8 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-base font-semibold text-gray-100 mb-2">
                            Select Class
                        </label>
                        <Select
                            value={selectedClass}
                            onChange={setSelectedClass}
                            options={classOptions}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            placeholder="Choose class..."
                            isSearchable={false}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '0.25rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    '&:hover': {
                                        borderColor: 'rgba(255, 255, 255, 0.2)'
                                    }
                                }),
                                menu: (base) => ({
                                    ...base,
                                    background: 'rgba(17, 24, 39, 0.95)',
                                    backdropFilter: 'blur(16px)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    background: state.isFocused ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: 'white',
                                    padding: '0.75rem 1rem'
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: 'white'
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: 'rgba(255, 255, 255, 0.5)'
                                })
                            }}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-base font-semibold text-gray-100 mb-2">
                            Download Format
                        </label>
                        <div className="flex space-x-4">
                            {formatOptions.map(({ value, label, icon: Icon }) => (
                                <motion.button
                                    key={value}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setDownloadFormat(value);
                                        setIsBrief(false); // Reset brief when changing format
                                    }}
                                    className={`flex-1 py-3 px-6 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200 ${downloadFormat === value
                                        ? 'bg-blue-600/30 border-blue-400/60 text-blue-100'
                                        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-blue-600/20 hover:border-blue-400/50 hover:text-blue-100'
                                        } flex items-center justify-center space-x-3`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    {downloadFormat === 'pdf' ? (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setIsBrief(false); // Detailed mode
                                    downloadData();
                                }}
                                disabled={isLoading || !selectedClass}
                                className={`inline-flex items-center px-8 py-4 mx-2 rounded-xl text-white space-x-3 shadow-lg transition-all duration-200 ${isLoading || !selectedClass
                                    ? 'bg-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-60'
                                    : 'bg-blue-600/20 border border-blue-400/40 hover:bg-blue-600/30 hover:border-blue-400/60'
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Download className="h-5 w-5" />
                                )}
                                <span className="font-medium">{isLoading ? 'Downloading...' : 'Download Detailed Data'}</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.0 }}
                                onClick={() => {
                                    setIsBrief(true); // Brief mode
                                    downloadData();
                                }}
                                disabled={isLoading || !selectedClass}
                                className={`inline-flex items-center px-8 py-4 mx-2 rounded-xl text-white space-x-3 shadow-lg transition-all duration-200 ${isLoading || !selectedClass
                                    ? 'bg-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-60'
                                    : 'bg-blue-600/20 border border-blue-400/40 hover:bg-blue-600/30 hover:border-blue-400/60'
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Download className="h-5 w-5" />
                                )}
                                <span className="font-medium">{isLoading ? 'Downloading...' : 'Download Brief Data'}</span>
                            </motion.button>
                        </>
                    ) : downloadFormat === 'word' ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={downloadData}
                            disabled={isLoading || !selectedClass}
                            className={`inline-flex items-center px-8 py-4 mx-2 rounded-xl text-white space-x-3 shadow-lg transition-all duration-200 ${isLoading || !selectedClass
                                ? 'bg-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-60'
                                : 'bg-blue-600/20 border border-blue-400/40 hover:bg-blue-600/30 hover:border-blue-400/60'
                                }`}
                        >
                            {isLoading ? (
                                <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                                <Download className="h-5 w-5" />
                            )}
                            <span className="font-medium">{isLoading ? 'Downloading...' : 'Download Word Data'}</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={downloadData}
                            disabled={isLoading || !selectedClass}
                            className={`inline-flex items-center px-8 py-4 mx-2 rounded-xl text-white space-x-3 shadow-lg transition-all duration-200 ${isLoading || !selectedClass
                                ? 'bg-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-60'
                                : 'bg-blue-600/20 border border-blue-400/40 hover:bg-blue-600/30 hover:border-blue-400/60'
                                }`}
                        >
                            {isLoading ? (
                                <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                                <Download className="h-5 w-5" />
                            )}
                            <span className="font-medium">{isLoading ? 'Downloading...' : 'Download Detailed Data'}</span>
                        </motion.button>
                    )}
                </div>

                <div className="mt-8 p-6 rounded-xl bg-blue-900/20 border border-blue-400/20 backdrop-blur-sm shadow-lg">
                    <h3 className="text-lg font-semibold text-blue-100 mb-4">Download Information</h3>
                    <ul className="list-disc list-inside space-y-2 text-base text-blue-100/80">
                        <li>Downloads data for users including both positive and negative balances</li>
                        <li>Select "All Classes" to download data across all classes</li>
                        <li>Includes admission number, name, class, and balance details</li>
                        <li>PDF format includes options for both detailed and brief data</li>
                        <li>Excel format allows for further data analysis and filtering</li>
                        <li>Word format allows for easy document sharing and printing</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
