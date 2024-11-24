import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#112233',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
    color: '#112233'
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 5
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf'
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  },
  tableCell: {
    width: '16.66%',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableCellContent: {
    fontSize: 9,
    textAlign: 'center'
  },
  classTitle: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#112233'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666'
  }
});

// Helper function to group users by class
const groupUsersByClass = (users) => {
  return users.reduce((acc, user) => {
    if (!acc[user.class]) {
      acc[user.class] = [];
    }
    acc[user.class].push(user);
    return acc;
  }, {});
};

export const UsersPdfDocument = ({ users, className, isBrief }) => {
  
  // Group users by class
  const groupedUsers = groupUsersByClass(users);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Conditionally Render Header */}
        {isBrief && (
          <View style={styles.header}>
            <Text style={styles.title}>User Report</Text>
            <Text style={styles.subtitle}>Class: {className}</Text>
            <Text style={styles.subtitle}>
              Generated on: {format(new Date(), 'PPpp')}
            </Text>
          </View>
        )}

        {/* Iterate over grouped classes */}
        {Object.keys(groupedUsers).map((classKey, idx) => (
          <View key={idx} wrap={false}>
            {/* Class Title */}
            {isBrief && <Text style={styles.classTitle}>Class: {classKey}</Text>}

            {/* Table Header */}
            <View style={[styles.table, styles.tableHeader]}>
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellHeader}>Ad. No</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellHeader}>Class</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellHeader}>Name</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellHeader}>Credit</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellHeader}>Usage Fee</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellHeader}>Balance</Text>
                </View>
              </View>
            </View>

            {/* Table Content */}
            {groupedUsers[classKey].map((user, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellContent}>{user.admissionNumber}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellContent}>{user.class}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellContent}>{user.name}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellContent}>{user.creditBalance?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellContent}>{user.totalUsageFee.toFixed(2)}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellContent}>{user.netBalance.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Footer for Detailed Report Only */}
        {isBrief && (
          <Text style={styles.footer}>
            This report contains users with all net balances. Generated automatically by the Lab Management System.
          </Text>
        )}
      </Page>
    </Document>
  );
};

export default UsersPdfDocument;
