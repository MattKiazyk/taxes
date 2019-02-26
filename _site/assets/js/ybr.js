var startYear = 2019
var startYearAssessment = 0
var startYearAssessmentClass = ""
var searchRollNo = 0

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

		var items = options.data.root;
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
			var index = startYear - year;
			var item = items[index];
			if (year == startYear) {
				startYearAssessment = item['Total']
				startYearAssessmentClass = item['Class']
			}

			if (item) {
				var assessment = item;

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

		// We know newer assessment but not in full taxes yet
		// So call after we have the latest assessment
		// once City of brandon updates in May - this can be called at the same time
		loadTaxes()
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

		// add in 2019 estimates
		var residentalRate = .45
		var commercialRate = .65

		var currentAssessment = startYearAssessment.replace(/,/g,"")
		var councilIncrease = 0.01170 //1.17% increase
		var millRate = 16.034 // 2019 mill rate
		var schoolMillRate = 14.990 //2019 proposed

		items =  items.reverse(); // sort opposite of what it comes so latest is first

		var item2019 = {}

		var firstItem = items[0]
		if ((firstItem["TAX_YEAR"].replace(/\s/g,'') === "" + 2018) && currentAssessment) {
			var rate = residentalRate
			if (startYearAssessmentClass == "OTHER PROPERTY") {
				rate = commercialRate
			}
			var propertyValue = (currentAssessment * rate / 1000 )

			var municipalBase =  propertyValue * millRate
			var schoolRate = propertyValue * schoolMillRate
			var municipal = municipalBase - firstItem["LOCAL_IMPROVEMENTS"]

			item2019["BRANDON_SCHOOL_DIVISION"] =  Number(schoolRate)//Number(firstItem["BRANDON_SCHOOL_DIVISION"]) //propertyValue * schoolMillRate
			item2019["PROVINCIAL_SCHOOL"] = Number(firstItem["PROVINCIAL_SCHOOL"])
			item2019["GENERAL_MUNICIPAL"] = Number(municipal)
			item2019["LOCAL_IMPROVEMENTS"] = Number(firstItem["LOCAL_IMPROVEMENTS"])
		 	item2019["GROSS_TAX"] = item2019["GENERAL_MUNICIPAL"] + item2019["LOCAL_IMPROVEMENTS"] + item2019["BRANDON_SCHOOL_DIVISION"] + item2019["PROVINCIAL_SCHOOL"]
			item2019["HOG_AMOUNT_CLAIMED"] = firstItem["HOG_AMOUNT_CLAIMED"]
			item2019["NET_TAX"] = item2019["GROSS_TAX"] - item2019["HOG_AMOUNT_CLAIMED"]
			item2019["TAX_YEAR"] = "2019"
		  items.unshift(item2019)
		}


		for (year = startYear; year > 2000; year--) {
			var item = null;
			for (index = 0; index < items.length - 1; index++) {
				var i = items[index]
				if (i["TAX_YEAR"].replace(/\s/g,'') === "" + year) {
					item = i
					break;
				}

			}
			if (item) {
				out = out + "<th>" + year + "</th>"
			}
			else {
				console.log("Missing year: " + year)
			}
		}
		out = out + "</tr>"

	 	out = out + "<tr>"
	  out = out + "<td>School Division</td>" + yearLoop(items, "BRANDON_SCHOOL_DIVISION");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Provincial Education</td>" + yearLoop(items, "PROVINCIAL_SCHOOL");
		out = out + "</tr>"
	  out = out + "<tr>"
	  out = out + "<td>General Municipal</td>" + yearLoop(items, "GENERAL_MUNICIPAL");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Local Improvements</td>" + yearLoop(items, "LOCAL_IMPROVEMENTS");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Gross Tax Amount</td>" + yearLoop(items, "GROSS_TAX");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Home Owner Grant</td>" + yearLoop(items, "HOG_AMOUNT_CLAIMED");
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Net Tax Amount</td>" + yearLoop(items, "NET_TAX");
		out = out + "</tr>"
		out = out + "</table>"

	  return out + "<strong>* 2019 ESTIMATED - Based on proposed millRate increases with ACTUAL 2019 property assessments. Actual 2019 property taxes may vary in May</strong> <br/><br/>";
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
	for (year = startYear; year > 2000; year--) {
		var distinctItem = null;
		for (index = 0; index < years.length - 1; index++) {
			var i = years[index]
			if (i["TAX_YEAR"].replace(/\s/g,'') === "" + year) {
				distinctItem = i
				break;
			}
		}

		if (distinctItem) {
			out = out + "<td>$" + Number(distinctItem[item]).formatMoney()  + "</td>"
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
  searchRollNo = search
	$('html, body').animate({
  	scrollTop: $("#mainData").offset().top
	});

	// Loads a map showing the property in satellite view
	loadMap(search);

	// Load assessments dynamically
	loadAssessments(search);

	// sales and meta are currently loaded from firebase still
	loadTaxesFromFirebase();

});

function loadTaxes() {
	var search = getParameterByName('rollNumber')
	if (search == null) {
			return
		}

	var taxesSource = $('#taxes-template').html();
	var taxesTemplate = Handlebars.compile(taxesSource);

	$('#taxes-wrapper').wait();

	var url = "http://opendata.brandon.ca/opendataservice/default.aspx?format=json&dataset=tax&columns=ROLL_NUMBER&values=" + search;
	console.log("Loading property tax information at: " + url);

	$.getJSON( url, function( data ) {

		// if user fills in an invalid rollNumber. Quit
		if (!data) {
			$('#taxes-wrapper').unwait();
			return
		}

		var taxesJSON = {"taxes":data};
		var taxesHTML = taxesTemplate(taxesJSON)

		$('#taxes-template').replaceWith(taxesHTML)
		$('#taxes-wrapper').unwait();

		// To make tables responsive after we've udpated them
		updateTables();
	});
}

function loadTaxesFromFirebase() {
	var search = getParameterByName('rollNumber')
	if (search == null) {
			return
		}

	var metaSource = $('#meta-template').html();
	var metaTemplate = Handlebars.compile(metaSource);

	var saleSource = $('#sales-template').html();
	var saleTemplate = Handlebars.compile(saleSource);

	$('#meta-wrapper').wait();

	$('#sales-wrapper').wait();

	// load Taxes from Firebase Databases
	firebase.initializeApp({
		databaseURL:'https://ybr.firebaseio.com/'
	})

	firebase.database().ref('taxes/' + search).on("value", function(snapshot) {

		var taxesJSON = {"taxes":snapshot.val()};

		var metaHTML = metaTemplate(taxesJSON)
		var saleHTML = saleTemplate(taxesJSON)


		$('#meta-template').replaceWith(metaHTML);
		$('#meta-wrapper').unwait();

		$('#sales-template').replaceWith(saleHTML);
		$('#sales-wrapper').unwait();

		// To make tables responsive after we've udpated them
		updateTables();

	}, function (errorObject) {
	  console.log("The read failed: " + errorObject.code);
	});
}

function loadAssessments(rollNo) {
	$('#assessment-wrapper').wait();
	var assessmentSource = $('#assessment-template').html();
	var assessmentTemplate = Handlebars.compile(assessmentSource);

	var url = 'http://www.mattkiazyk.com/bites/005/assess.php?type=json&roll=' + rollNo;
	console.log("Loading assessments dynamically at: " + url + " via https://web22.gov.mb.ca/MAO/Public/summary.aspx?lang=EN&extrct_prop_id=17572741&roll_id=XXXXXXX&tax_year=2019&extr_typ_ind=T");
	$.getJSON( url, function( data ) {
  	var items = [];
		var assessmentHtml = assessmentTemplate(data.assessment);

		$('#assessment-template').replaceWith(assessmentHtml);
		$('#assessment-wrapper').unwait();

		updateTables();
	});
}

function loadMap(rollNo) {
	var map = L.map('map', {
		scrollWheelZoom: false
	})

	L.esri.imageMapLayer({
		url: 'https://gisapp.brandon.ca/arcgis/rest/services/Imagery/Imagery_2013/ImageServer'
	}).addTo(map).bringToBack();

	// This will show streets and Property lines. Do we want this? Looks cleaner without.
	// L.esri.dynamicMapLayer({
	// 	url: 'http://gis.brandon.ca/arcgis/rest/services/Juliet/propertySearch/MapServer',
	// 	transparent : true,
	// 	layers : [1,2,4,8,10],
	// 	imageSR : 26914
	// }).addTo(map).bringToFront();

	// Shows property polygon
	var find = L.esri.find({
		url: 'https://gisapp.brandon.ca/arcgis/rest/services/Open_Data/Open_Data/MapServer'
	});

	find.layers('22')
			.text(rollNo)
			.fields('ROLL_NUM')
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

	// can't find lead pipes on gisapp services
		//
		// // LEAD PIPES
		// var query = L.esri.query({
		// 	    url:'http://gis.brandon.ca/arcgis/rest/services/COBRA/COBRAmapService/MapServer/12'
		// 	});
		//
		// 	query.where("InstallDate<='Jan 1, 1952'");
		//
		// 	query.run(function(error, featureCollection, response){
		// 	    console.log('Found ' + featureCollection.features.length + ' features');
		// 			var polyLine =	L.geoJson(featureCollection, {
		// 				style: leadPipeStyle,
		// 				onEachFeature: onEachFeature
		// 			});
		// 			polyLine.addTo(map).bringToFront();
		//
		// 	});
		//
		// 	var info = L.control();
		//
		// 	info.onAdd = function (map) {
		// 	    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		// 	    this.update();
		// 	    return this._div;
		// 	};
		//
		// 	// method that we will use to update the control based on feature properties passed
		// 	info.update = function (props) {
		// 	    this._div.innerHTML = '<h4>Lead Pipes</h4>Click on any red line to<br />show info on potential lead pipes.</br><a href="http://www.brandon.ca/water-treatment/lead-water-services-information">More Info</a>';
		// 	};
		//
		// 	info.addTo(map);
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
