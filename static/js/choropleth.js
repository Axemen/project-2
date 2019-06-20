d3.json('static/data/us-states.json').then(statesData => {
    metric = 'av';
    year = '2011';
    d3.csv(`static/data/year_state_sm_avg.csv`).then(warData => {

        const corner1 = L.latLng(15.45, -163.3),
            corner2 = L.latLng(65.36, -44.47),
            bounds = L.latLngBounds(corner1, corner2);

        const map = L.map('map', {
            maxBounds: bounds
        }).setView([37.8, -96], 4);

        const lightLayer = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>, <br> Created by Jonathan Randolph",
            maxZoom: 6,
            minZoom: 3,
            maxBounds: map.getBounds(),
            id: "mapbox.light",
            accessToken: MAPBOX_KEY
        }).addTo(map);

        statesData.features.forEach(f => {
            warData.forEach(d => {
                // if (d.year == year) {
                if (d.state == f.properties.abbr) {
                    switch (metric) {
                        case 'per': f.properties[d.year] = d.per;
                            break;
                        case 'av': f.properties[d.year] = d.av;
                            break;
                        case 'war': f.properties[d.year] = d.war;
                            break;
                    }
                }
                // }
            });
        });

        const asc = arr => arr.sort((a, b) => a - b);

        let smList = []
        for (i = 0; i < statesData.features.length; i++) {
            if (statesData.features[i].properties.hasOwnProperty(year)) {
                smList.push(parseInt(statesData.features[i].properties[year]));
            }
        }
        console.log(smList);
        asc(smList);

        function getColor(d) {
            if (typeof d === 'undefined') return '#ffffff';
            return d > d3.max(smList) ? '#ee3e32' :
                d > d3.quantile(smList, .75) ? '#f68838' :
                    d > d3.mean(smList) ? '#fbb021' :
                        d > d3.quantile(smList, .25) ? '#1b8a5a' :
                            '#1d4877'
        }
        function style(feature) {
            return {
                fillColor: getColor(feature.properties[year]),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }
        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
            info.update(layer.feature.properties);
        }

        function resetHighlight(e) {
            geojson.resetStyle(e.target);
            info.update();
        }

        function zoomToFeature(e) {
            map.fitBounds(e.target.getBounds());
        }

        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }

        var geojson = L.geoJson(statesData, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        var info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (props) {
            this._div.innerHTML = '<h4> Average ' + metric.toUpperCase() + ' Rating Per state</h4>' + (props ?
                '<b>' + props.abbr + '</b><br />' + props[year] + ' War'
                : 'Hover over a state');

        };

        info.addTo(map);

        let legend = L.control({
            position: 'bottomright'
        });

        legend.onAdd = function (map) {
            let div = L.DomUtil.create('div', 'info legend'),
                grades = [d3.min(smList), parseInt(d3.quantile(smList, .25)), parseInt(d3.mean(smList)), parseInt(d3.quantile(smList, .75)), d3.max(smList)],
                labels = ['0-25', '25-50', '50-75', '75-100', 'percentile'];

            for (var i = 0; i < grades.length; i++) {
                div.innerHTML += '<i style= "background:' + getColor(grades[i] + 1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }
            return div;
        };

        legend.addTo(map);

        const yearDropdown = d3.select('#year-dropdown').on('change', d => {
            year = d3.event.target.value;
            geojson.setStyle(style);
        })

    });
});
