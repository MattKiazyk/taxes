var startYear = 2019
		
//**AUTOCOMPLETE **//
$(function() {
	$('#address').autocomplete({
			minLength:3,
	    source: function(request, response){
					$.ajax({
						url:"http://opendata.brandon.ca/opendataservice/Default.aspx",
						type:"GET",
						dataType:"jsonp",
						contentType: "application/json",
						async: true,
						jsonpCallback: "autocompletecallback",
						data: {
							dataset: "property",
							columns: "STREET_ADDRESS",
							format: "jsonp",
							values: request.term
						},
						success: function( data ) {
							var newData = [];
							
							// add all the possible address names obtain from server to hint list on client side
							for (var i = 0; i < data.length; i++) {
								newData.push({'value':data[i].dROLLNMBR, 'label':data[i].STREET_ADDRESS});
							} //for each
							response( newData );
						},
					});		
	    }
	});
});

$(document).ready(function () {

	Handlebars.registerHelper('assessmentTable', function(items, options) {
	
		var items = options.data.root.taxes;
	  var out = "<table class='responsive'>";
		out = out + "<tr>"
		out = out + "<th>Tax Year</th>";
		out = out + "<th>Reference Date</th>";
		out = out + "<th>Class</th>";
		out = out + "<th>Land</th>";
		out = out + "<th>Buildings</th>";
		out = out + "<th>Total</th>";
		out = out + "</tr>"
		
	  for (year = startYear; year > 2000; year--) {
			var item = items[year];
			if (item) {
				var assessment = item.assessment;
				if (assessment) {
					out = out + "<tr>"
			    out = out + "<td>" + year + "</td>";
			    out = out + "<td>" + assessment['Assessment Reference Date'] + "</td>";
			    out = out + "<td>" + assessment['Class'] + "</td>";
			    out = out + "<td>" + assessment['Land'] + "</td>";
			    out = out + "<td>" + assessment['Buildings'] + "</td>";
			    out = out + "<td>" + assessment['Total'] + "</td>";
					out = out + "</tr>"
				}
			}
	  }
	  return out + "</table>";
	});

	Handlebars.registerHelper('saleTable', function(items, options) {
		var items = options.data.root.taxes;
	  var out = "<table class='responsive'>";
		out = out + "<tr>"
		out = out + "<th>Sale Date</th>";
		out = out + "<th>Consideration</th>";
		out = out + "</tr>"
		
	  for (year = startYear; year > 2000; year--) {
			var item = items[year];
			if (item) {
				var sale = item.sales;

				for(var saleItem in sale){
					var saleDetail = sale[saleItem]
					out = out + "<tr>"
			    out = out + "<td>" + saleDetail['Sale Date'] + "</td>";
			    out = out + "<td>" + saleDetail.Consideration + "</td>";
					out = out + "</tr>"			
				}
			}
	  }
	  return out + "</table>";
	});
	
	Handlebars.registerHelper('taxesTable', function(items, options) {
	  var out = "<table class='responsive'>";
		out = out + "<tr>"
		out = out + "<th>Type</th>";
		
		// add in 2017 estimates
		var residentalRate = .45
		var commercialRate = .65
		
		var currentAssessment = parseInt(items[2018].assessment['Total'].replace(/,/g,""))
		var councilIncrease = 0.00940 //0.94% increase
		var millRate = 16.101
		var schoolMillRate = 14.91 //14.50 2016 * 1.0285
		console.log(items[2017])
		console.log(currentAssessment)

		if (items[2017] && currentAssessment) {
			var rate = residentalRate
			if (items[2017].assessment['Class'] == "OTHER PROPERTY") {
				rate = commercialRate
			}
			var propertyValue = (currentAssessment * rate / 1000 )
			console.log(propertyValue)
			var municipalBase =  propertyValue * millRate
			var municipal = municipalBase - items[2017]["Loc_Imp_Debt_Serv"]
			
			items[2018]["School_Division"] = propertyValue * schoolMillRate
			items[2018]["Provincial_Education"] = items[2017]["Provincial_Education"]
			items[2018]["General_Municipal"] = municipal
			items[2018]["Loc_Imp_Debt_Serv"] = items[2017]["Loc_Imp_Debt_Serv"]
			items[2018]["Gross_Tax_Amount"] = items[2018]["General_Municipal"] + items[2018]["Loc_Imp_Debt_Serv"] + items[2018]["School_Division"] + items[2018]["Provincial_Education"] 
			items[2018]["Home_Owner_Grant"] = items[2017]["Home_Owner_Grant"] 
			items[2018]["Net_Tax_Amount"] = items[2018]["Gross_Tax_Amount"] - items[2018]["Home_Owner_Grant"] 
		}
		
		
		for (year = startYear - 1; year > 2000; year--) {
			if (items[year]) {	
				out = out + "<th>" + year + "</th>"
			}
		}
		out = out + "</tr>"

	 	out = out + "<tr>"
	  out = out + "<td>School Division</td>" + yearLoop(items, "School_Division");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Provincial Education</td>" + yearLoop(items, "Provincial_Education");
		out = out + "</tr>"		
	  out = out + "<tr>"
	  out = out + "<td>General Municipal</td>" + yearLoop(items, "General_Municipal");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Local Improvements</td>" + yearLoop(items, "Loc_Imp_Debt_Serv");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Gross Tax Amount</td>" + yearLoop(items, "Gross_Tax_Amount");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Home Owner Grant</td>" + yearLoop(items, "Home_Owner_Grant");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Net Tax Amount</td>" + yearLoop(items, "Net_Tax_Amount");
		out = out + "</tr>"
		out = out + "</table>"
		
	  return out + "<strong>* 2018 ESTIMATED - Actual 2018 may vary</strong> <br/><br/>";
	});
	
	Handlebars.registerHelper('metaTable', function(items, options) {
		var items = options.data.root.taxes;
		var out = "<table class='responsive'>"
		if (items["address"]) {
			out = out + "<tr>"
			out = out + "<td>Civic Address:</td><td>" + items["address"] + "</td>"
			out = out + "</tr>"
		}
		if (items["frontage"]) {
			out = out + "<tr>"
			out = out + "<td>Frontage:</td><td>" + items["frontage"] + " feet</td>"
			out = out + "</tr>"
		}
		if (items["legal"]) {
			out = out + "<tr>"
			out = out + "<td>Legal:</td><td>" + items["legal"] + "</td>"
			out = out + "</tr>"
		}
		out = out + "</table>"
		
	
		return out
	})
});

function yearLoop(years, item) {
	var out = ""
	for (year = startYear - 1; year > 2000; year--) {
		if (years[year]) {
			out = out + "<td>$" + Number(years[year][item]).formatMoney()  + "</td>"
		}
	}
	return out
}
//***SEARCH!!!!***//

$( window ).load(function() {
	var search = getParameterByName('rollNumber')
	if (search == null) {
			return
		}
	
	$('html, body').animate({
  	scrollTop: $("#mainData").offset().top
	});

	//var assessmentHTML = getAssessmentHTML(search)	
	
	var assessmentSource = $('#assessment-template').html();
	var assessmentTemplate = Handlebars.compile(assessmentSource);
	var metaSource = $('#meta-template').html();
	var metaTemplate = Handlebars.compile(metaSource);
	var taxesSource = $('#taxes-template').html();
	var taxesTemplate = Handlebars.compile(taxesSource);
	var saleSource = $('#sales-template').html();
	var saleTemplate = Handlebars.compile(saleSource);
	
	$('#meta-wrapper').wait();
	$('#taxes-wrapper').wait();
	$('#assessment-wrapper').wait();
	$('#sales-wrapper').wait();
	
	// Loads a map showing the property in satellite view 
	loadMap(search);
	
	// load Taxes from Firebase Databases
	firebase.initializeApp({
		databaseURL:'https://ybr.firebaseio.com/'
	})
	
	firebase.database().ref('taxes/' + search).on("value", function(snapshot) {

		// if user fills in an invalid rollNumber. Quit
		if (!snapshot.exists()) {
			$('#taxes-wrapper').unwait();
			return
		}
		var taxesJSON = {"taxes":snapshot.val()};
		var taxesHTML = taxesTemplate(taxesJSON)

		var assessmentHtml = assessmentTemplate(taxesJSON)
		var metaHTML = metaTemplate(taxesJSON)
		var saleHTML = saleTemplate(taxesJSON)
			
		$('#taxes-template').replaceWith(taxesHTML)
		$('#taxes-wrapper').unwait();
		
		$('#assessment-template').replaceWith(assessmentHtml);
		$('#assessment-wrapper').unwait();	
		
		$('#meta-template').replaceWith(metaHTML);
		$('#meta-wrapper').unwait();	
		
		$('#sales-template').replaceWith(saleHTML);
		$('#sales-wrapper').unwait();
		
		// To make tables responsive after we've udpated them
		updateTables();

	}, function (errorObject) {
	  console.log("The read failed: " + errorObject.code);
	});


});

function loadMap(rollNo) {
	var map = L.map('map', {
		scrollWheelZoom: false
	})

	L.esri.imageMapLayer({
		url: 'http://gis.brandon.ca/arcgis/rest/services/COBRA/BrandonOrtho2013/ImageServer'
	}).addTo(map).bringToBack();

	// This will show streets and Property lines. Do we want this? Looks cleaner without.
	L.esri.dynamicMapLayer({
		url: 'http://gis.brandon.ca/arcgis/rest/services/Juliet/propertySearch/MapServer',
		transparent : true,
		layers : [1,2,4,8,10],
		imageSR : 26914
	}).addTo(map).bringToFront();
	
	// Shows property polygon
	var find = L.esri.find({
		url: 'http://gis.brandon.ca/arcgis/rest/services/Juliet/propTax/MapServer'
	});

	find.layers('0')
			.text(rollNo)
			.fields('BROLL')
			.contains(false)
		
	find.run(function(error, featureCollection, response){
		var polygon =	L.geoJson(featureCollection, {
			style: style
		});
		var center = polygon.getBounds().getCenter();
		polygon.addTo(map).bringToFront();
		// fit the map to around the polygon
		map.fitBounds(polygon.getBounds().pad(0.5));
	});
	
	// LEAD PIPES
	var query = L.esri.query({
		    url:'http://gis.brandon.ca/arcgis/rest/services/COBRA/COBRAmapService/MapServer/12'
		});
		
		query.where("InstallDate<='Jan 1, 1952'");
		
		query.run(function(error, featureCollection, response){
		    console.log('Found ' + featureCollection.features.length + ' features');
				var polyLine =	L.geoJson(featureCollection, {
					style: leadPipeStyle,
					onEachFeature: onEachFeature
				});
				polyLine.addTo(map).bringToFront();

		});
		
		var info = L.control();

		info.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};

		// method that we will use to update the control based on feature properties passed
		info.update = function (props) {
		    this._div.innerHTML = '<h4>Lead Pipes</h4>Click on any red line to<br />show info on potential lead pipes.</br><a href="http://www.brandon.ca/water-treatment/lead-water-services-information">More Info</a>';
		};

		info.addTo(map);
}

function style(feature) {
    return {
        fillColor: 'yellow',
        weight: 2,
        opacity: 0.6,
        color: 'yellow',
        fillOpacity: 0.2
    };
}

function leadPipeStyle(feature) {
    return {
        fillColor: 'red',
        weight: 2,
        opacity: 0.6,
        color: 'red',
        fillOpacity: 0.2
    };
}

function onEachFeature(feature, layer) {
	var print = function(o){
	    var str='';

	    for(var p in o){
					if (p == 'OBJECTID' || p == 'GlobalID') {
						continue;
					}
	        if(typeof o[p] == 'object'){
	            str+= p + ': { </br>' + print(o[p]) + '}';
	        }else{
							if (typeof o[p] == 'number') {
								var d = new Date(o[p]);
								if (d) {
									str+= p + ': ' + d.toISOString().slice(0, 10) +'</br>';
								} else {
									str+= p + ': ' + o[p]+'</br>';
								}
							} else {
	            	str+= p + ': ' + o[p]+'</br>';
							}
	        }
	    }
	    return str;
	}

    if (feature.properties) {
        layer.bindPopup(print(feature.properties));
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

Number.prototype.formatMoney = function(decPlaces, thouSeparator, decSeparator) {
    var n = this,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
};
