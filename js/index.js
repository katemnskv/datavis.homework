const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    
    d3.select('#p').on('change', function(){ 
        lineParam = d3.select(this).property('value');
        updateLinePlot();
        updateBar();
    });


    function updateBar(){
        
        let regions = d3.set(data.map(d=>d.region)).values();

        var region_mean = [];
        regions.forEach(function(region_name){
          values_for_region = data.filter(function(d){return d.region == region_name;});
          region_mean.push({
              "region": region_name, 
              "mean_value": d3.mean(values_for_region, d => d[param][year])
            });
        });

        xBar.domain(regions);
        yBar.domain([0, d3.max(region_mean.map(d => d.mean_value))])

        xBarAxis.call(d3.axisBottom(xBar));
        yBarAxis.call(d3.axisLeft(yBar));

        barChart.selectAll("rect").remove();


        barChart.selectAll("rect")
            .data(region_mean)
            .enter()
            .append("rect")
                .attr("x", d => xBar(d.region))
                .attr("y", d => yBar(d.mean_value))
                .attr("width", xBar.bandwidth())
                .attr("height", d => height - margin - yBar(d.mean_value))
                .attr("fill", d => colorScale(d.region));

        barChart.selectAll("rect").on("click", function(click_bar) {

            highlighted = click_bar.region;

            d3.selectAll("rect")
                .transition()
                .style("opacity", d => d.region == highlighted ? 1.0 : 0.3);

            d3.selectAll("circle")
                .transition()
                .style("opacity", d => d.region == highlighted ? 1.0 : 0.0);

        });

        return;
    }

    function updateScatterPlot(){
        scatterPlot.selectAll("g").remove();

        let X = d3.scaleLinear()
            .range([margin * 2, width - margin])
            .domain([
                d3.min(data, function (d) {
                    return +d[xParam][year];
                }),
                d3.max(data, function (d) {
                    return +d[xParam][year];
                })
            ]);

        let Y = d3.scaleLinear()
            .range([height - margin, margin])
            .domain([
                d3.min(data, function (d) {
                    return +d[yParam][year];
                }),
                d3.max(data, function (d) {
                    return +d[yParam][year];
                })
            ]);

        scatterPlot.append('g')
            .attr('transform', `translate(0, ${height - margin})`)
            .call(d3.axisBottom(X));

        scatterPlot.append('g')
            .attr('transform', `translate(${margin * 2}, 0)`)
            .call(d3.axisLeft(Y))

        var radiusScale = d3.scaleSqrt()
            .range([10, 30])
            .domain([
                d3.min(data, function (d) {
                    return +d[rParam][year];
                }),
                d3.max(data, function (d) {
                    return +d[rParam][year];
                })
            ]);

        scatterPlot.append('g')
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .on('click', ScatterClick)
            .attr("cx", function (d) {
                return X(d[xParam][year]);
            })
            .attr("cy", function (d) {
                return Y(d[yParam][year]);
            })
            .attr("r", function (d) {
                return radiusScale(d[rParam][year]);
            })
            .style("fill", function (d) {
                return colorScale(d.region);
            })
            .attr("region", function (d) {
                return d.region
            })
            .style("opacity", "0.3")
            .attr("stroke", "green")
        scatterPlot.selectAll("circle").on("click", function(cl_circle) {

            selected = cl_circle.country;

            d3.selectAll("circle")
                .transition()
                .attr("stroke-width", d => d.country == selected ? 1.0 : 1.0);

            updateLinePlot();
        })
        
        return;
    }

  function  updateLinePlot() {
        
        if (selected != "") {

            d3.select(".country-name").text(selected);

            const country_index = data.findIndex(d => d.country === selected);
            if (country_index === -1) return;

            var data_for_selected = data[country_index][lineParam];

            let year_value_list = [];
            for (let currentYear = 1800; currentYear < 2021; currentYear++) {
                year_value_list.push({"year": currentYear, "param_value": parseFloat(data_for_selected[currentYear]) || 0});
            };

            let xRange = d3.values(year_value_list).map(d => d["year"]);
            let yRange = d3.values(year_value_list).map(d => d["param_value"]);

            x.domain([d3.min(xRange), d3.max(xRange)]);
            y.domain([d3.min(yRange) * 0.5, d3.max(yRange) * 1.1]);

            xLineAxis.call(d3.axisBottom(x));
            yLineAxis.call(d3.axisLeft(y));

            lineChart.select(".lineData").remove();

            lineChart.append('g')
                .append('path')
                .datum(year_value_list)
                .attr("class", "lineData")
                .attr("fill", "none")
                .attr("stroke", "#ffc0cb")
                .attr("stroke-width", 2.0)
                .attr("d", d3.line()
                    .x(d => x(d["year"]))
                    .y(d => y(d["param_value"]))
                    );
        }

        return;
    }



            updateBar();
            updateScatterPlot();
        });




async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}