var chartDataMale=[];
var chartDataFemale=[];
var chartData=[];

var planColors = {
    "Bowtie": "#ff0068",
    // Add more plans and their colors here
    // "PlanName": "ColorCode"
};

var filteredDataGlobal;
var selectAllElement=document.querySelector("#selectAll");



function drawChart() {
    var selectedPlans = getSelectedPlans();
    var filteredData = filterData(chartData, selectedPlans);
    filteredDataGlobal=filteredData;
    //find the max value of the age 65
    var maxValue = Math.max(...filteredData[100]);
    //var maxValue = 20000;
    var vAxisMaxValue=(Math.ceil(maxValue/5000)+1)*5000;

    var data = google.visualization.arrayToDataTable(filteredData);

   var options = {
        hAxis: {
            title: '年齡',
            gridlines: { count: 10 }
        },
        vAxis: {
            title: '每年保費',
            format: '$#,###', // This will format the numbers with a K for thousand, M for million, etc.
            viewWindow: {
                min: 0,
                max: vAxisMaxValue // or a suitable maximum value based on your data
            },
            gridlines: { 
                count: 6
                //multiple: 20000 
             }
        },
        series: getSeriesOptions(selectedPlans),
        curveType: 'none',
        legend: { position: 'bottom' },
        width: '100%',
        height: getChartHeight(),
        chartArea: {  left: '15%',width: '85%' } 
    };

    var chart = new google.visualization.LineChart(document.getElementById('line_chart'));
    chart.draw(data, options);
}

function getSelectedPlans() {
    var checkboxes = document.querySelectorAll('.planOption');
    var selectedPlanIndices = [];

    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            var label = document.querySelector('label[for="' + checkbox.id + '"]');
            if (label) {
                var planName = label.textContent.trim();
                var columnIndex = findColumnIndexByPlanName(planName);
                if (columnIndex !== -1) {
                    selectedPlanIndices.push(columnIndex);
                }
            }
        }
    });

    return selectedPlanIndices;
}

function findColumnIndexByPlanName(planName) {
    var headers = chartData[0];
    return headers.indexOf(planName)-1;
}


function getSeriesOptions(selectedPlanIndices) {
    var seriesOptions = {};
    var headers = chartData[0];

    selectedPlanIndices.forEach(function(index, i) {
        var planName = headers[index + 1]; // +1 to skip the 'Age' column
        var color = planColors[planName];
        if (color) {
            seriesOptions[i] = { color: color };
        }
    });

    return seriesOptions;
}


function selectAllCheckboxes(source,selectBool) {
    var checkboxes = document.querySelectorAll('.planOption');
    checkboxes.forEach(function(checkbox) {
        if (selectBool) {
            checkbox.checked = source.checked;
        } else {
            checkbox.checked = false;
            source.checked=false;
            document.querySelector("#selectAll").checked=false;
        }
    });
    drawChart();
}

function filterData(data, selectedPlanIndices) {
    var headers = data[0];
    var filteredHeaders = ['Age'];
    var columnIndex = [];

    selectedPlanIndices.forEach(function(planIndex) {
        filteredHeaders.push(headers[planIndex + 1]); // +1 because the first column is 'Age'
        columnIndex.push(planIndex + 1);
    });

    var filteredData = [filteredHeaders];

    for (var i = 1; i < data.length; i++) {
        var row = [data[i][0]]; // Add age
        columnIndex.forEach(function(index) {
            row.push(data[i][index]);
        });
        filteredData.push(row);
    }
    return filteredData;
}

function getChartHeight() {
    var chartWidth = document.getElementById('line_chart').offsetWidth;
    return chartWidth * 0.5625; // 16:9 aspect ratio
}

function preventDropdownClose(event) {
    event.stopPropagation();
}

function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"' && row[i + 1] === '"') {
            // Handle escaped quotes
            current += '"';
            i++; // Skip the next quote
        } else if (char === '"') {
            // Toggle inQuotes state
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // End of a field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last field
    result.push(current.trim());

    return result.map(value => {
        // Remove quotation marks and commas for numbers
        const cleanedValue = value.replace(/["']/g, '').trim();
        const numericValue = cleanedValue.replace(/,/g, '');
        return isNaN(numericValue) ? cleanedValue : Number(numericValue);
    });
}

async function fetchAndParseCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        const rows = csvText.trim().split('\n');
        return rows.map(parseCSVRow);
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);
        return null;
    }
}


const femaleCsvUrl = 'chartDataFemale.csv'; 
fetchAndParseCSV(femaleCsvUrl).then(data => {
    if (data) {        
        chartDataFemale=data;
    }
});

const maleCsvUrl = 'chartDataMale.csv'; 
fetchAndParseCSV(maleCsvUrl).then(data => {
    if (data) {        
        chartDataMale=data;      
        chartData=chartDataMale;
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(drawChart);
        window.addEventListener('resize', function() {
            drawChart();
        });
        
        drawChart();
    }
});



