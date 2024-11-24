import React from 'react';
import ApexCharts from 'react-apexcharts';
import { format } from 'date-fns';

export default function AnalyticsOverview({ mergedData, sessionPart, creditPart, printPart }) {
  
  // Extract the data for the chart
  const dates = mergedData.map(d => d.date);
  const sessions = mergedData.map(d => d.sessions);
  const usageFee = mergedData.map(d => d.usageFee);
  const credits = mergedData.map(d => d.credits);
  const prints = mergedData.map(d => d.prints);
  

  // Determine which lines should be highlighted based on the props
  const highlightSessions = sessionPart === true;
  const highlightCredits = creditPart === true;
  const highlightPrints = printPart === true;
  const highlightAll = sessionPart === false && creditPart === false && printPart === false;

  // Configure the chart options
  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      zoom: {
        enabled: true,
        type: 'xy', // Zoomable on both axes
        mouseWheel: {
          enabled: true, // Enable zooming on mouse wheel
          zoomedArea: {
            fill: { color: 'rgba(0, 0, 0, 0.1)' },
            stroke: { color: '#000' },
          },
        },
      },
    },
    colors: ['#3b82f6', '#10b981', '#f43f5e', '#d1bb11'], // Colors for sessions, credits, etc.
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    xaxis: {
      categories: dates,
      labels: { style: { colors: '#94a3b8' } },
      min: '11/01/2024', // Start from the given date
      max: format(new Date(), 'MM/dd'), // Up to today
    },
    yaxis: {
      min: 0, // Ensure Y-axis starts from 0
      labels: { style: { colors: '#94a3b8' } },
    },
    tooltip: {
      theme: 'dark',
    },
    legend: {
      labels: {
        colors: ['#3b82f6', '#10b981', '#f43f5e', '#d1bb11'], // Colors for legend labels
      },
      fontSize: '14px',
      itemMargin: { horizontal: 10 },
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.2)', // Border color with opacity
      strokeDashArray: 0, // Remove dashed lines for solid grid
    },
    plotOptions: {
      area: {
        fillTo: 'origin', // Fill the area to the origin
      },
    },
    // Disabling non-highlighted series
    series: [
      {
        name: 'Sessions',
        data: sessions,
        hidden: !highlightSessions && !highlightAll, // Use show instead of disabled
      },
      {
        name: 'Credits',
        data: credits,
        hidden: !highlightCredits && !highlightAll, // Use show instead of disabled
      },
      {
        name: 'Usage Fee (₹)',
        data: usageFee,
        hidden: !highlightSessions && !highlightAll, // Show if session or credit is highlighted
      },
      {
        name: 'Prints',
        data: prints,
        hidden: !highlightPrints && !highlightAll, // Hide Prints series by default
      },
    ],
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Analytics Overview</h2>
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 h-80">
        <ApexCharts 
          options={chartOptions} 
          series={chartOptions.series} 
          type="area" 
          height="100%" 
        />
      </div>
    </div>
  );
}
