
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
	  var out = "<table class='responsive'>";
		out = out + "<tr>"
		out = out + "<th>Tax Year</th>";
		out = out + "<th>Assessment Reference Date</th>";
		out = out + "<th>Class</th>";
		out = out + "<th>Land</th>";
		out = out + "<th>Buildings</th>";
		out = out + "<th>Total</th>";
		out = out + "</tr>"

	  for(var i=0, l=items.length; i<l; i++) {
			out = out + "<tr>"
	    out = out + "<td>" + items[i]["Tax Year"] + "</td>";
	    out = out + "<td>" + items[i]["Assessment Reference Date"] + "</td>";
	    out = out + "<td>" + items[i]["Class"] + "</td>";
	    out = out + "<td>" + items[i]["Land"] + "</td>";
	    out = out + "<td>" + items[i]["Buildings"] + "</td>";
	    out = out + "<td>" + items[i]["Total"] + "</td>";
			out = out + "</tr>"
	  }
	  return out + "</table>";
	});

	Handlebars.registerHelper('taxesTable', function(items, options) {
	  var out = "<table class='responsive'>";
		out = out + "<tr>"
		out = out + "<th>Type</th>";
		out = out + "<th>2015</th>";
		out = out + "<th>2014</th>";
		out = out + "</tr>"

	 	out = out + "<tr>"
	  out = out + "<td>School Division</td>"+ "<td>$" + Number(items[2015]["School_Division"]).formatMoney() + "</td>" + "<td>$" + Number(items[2014]["School_Division"]).formatMoney()  + "</td>";
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Provincial Education</td>"+ "<td>$" + Number(items[2015]["Provincial_Education"]).formatMoney()  + "</td>" + "<td>$" + Number(items[2014]["Provincial_Education"]).formatMoney()  + "</td>";
		out = out + "</tr>"		
	  out = out + "<tr>"
	  out = out + "<td>General Municipal</td>"+ "<td>$" + Number(items[2015]["General_Municipal"]).formatMoney()  + "</td>" + "<td>$" + Number(items[2014]["General_Municipal"]).formatMoney()  + "</td>";
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Loc. Imp. Debt Serv.</td>"+ "<td>$" + Number(items[2015]["Loc_Imp_Debt_Serv"]).formatMoney()  + "</td>" + "<td>$" + Number(items[2014]["Loc_Imp_Debt_Serv"]).formatMoney()  + "</td>";
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Local Improvements</td>"+ "<td>$" + Number(items[2015]["Local_Improvements"]).formatMoney()  + "</td>" + "<td>$" + Number(items[2014]["Local_Improvements"]).formatMoney()  + "</td>";
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Gross Tax Amount</td>"+ "<td>$" + Number(items[2015]["Gross_Tax_Amount"]).formatMoney()  + "</td>" + "<td>$" + Number(items[2014]["Gross_Tax_Amount"]).formatMoney()  + "</td>";
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Home Owner Grant</td>"+ "<td>$" + Number(items[2015]["Home_Owner_Grant"]).formatMoney()  + "</td>" + "<td>$" + Number(items[2014]["Home_Owner_Grant"]).formatMoney()  + "</td>";
		out = out + "</tr>"
		out = out + "<tr>"
	  out = out + "<td>Net Tax Amount</td>"+ "<td>$" + Number(items[2015]["Net_Tax_Amount"]).formatMoney()  + "</td>" + "<td>$" + Number(items[2014]["Net_Tax_Amount"]).formatMoney()  + "</td>";
		out = out + "</tr>"
	  return out + "</table>";
	});
	
	Handlebars.registerHelper('metaTable', function(items, options) {
		return items;
	})
	
});

//***SEARCH!!!!***//

$( window ).load(function() {
	var search = getParameterByName('rollNumber')
	if (search == null) {
		return
	}
	
	$('html, body').animate({
  	scrollTop: $("#mainData").offset().top
	});

	var assessmentHTML = getAssessmentHTML(search)	
	
	var assessmentSource = $('#assessment-template').html();
	var assessmentTemplate = Handlebars.compile(assessmentSource);
	var metaSource = $('#meta-template').html();
	var metaTemplate = Handlebars.compile(metaSource);
	var taxesSource = $('#taxes-template').html();
	var taxesTemplate = Handlebars.compile(taxesSource);
	
	$('#meta-wrapper').wait();
	$('#taxes-wrapper').wait();
	$('#assessment-wrapper').wait();	
	
	// Loads a map showing the property in satellite view 
	loadMap(search);
	
	Promise.all([assessmentHTML]).then(function(json) {	
		
		var items = {"assessment":json[0]};
		var html = assessmentTemplate(items)
		var metaHTML = metaTemplate(items)

	 	$('#assessment-template').replaceWith(html);
		$('#meta-template').replaceWith(metaHTML);
		
		$('#meta-wrapper').unwait();
		$('#assessment-wrapper').unwait();	
		
		// To make tables responsive after we've udpated them
		updateTables();
	})
	
	// load Taxes from Firebase Databases
	// This was downloaded in Jan 2016 as City of Brandon likes to remove old information (and not provide a way to get it)
	// So when 2016 taxes are populated, we will have 3 years of history
	var url = 'https://ybr.firebaseio.com/taxes/' + search 
	var taxesRef = new Firebase(url)
	taxesRef.authAnonymously(function(error, authData) {
		  if (error) {
		    console.log("Authentication failed with Firebase storage!", error);
		  } else {
		    console.log("Authenticated successfully with Firebase storage API");
				taxesRef.on("value", function(snapshot) {
					// if user fills in an invalid rollNumber. Quit
					if (!snapshot.exists()) {
						$('#taxes-wrapper').unwait();
						Firebase.goOffline();						
						return
					}
					
					var taxesJSON = {"taxes":snapshot.val()};
					var taxesHTML = taxesTemplate(taxesJSON)
					
					$('#taxes-template').replaceWith(taxesHTML)
					$('#taxes-wrapper').unwait();
					
					// To make tables responsive after we've udpated them
					updateTables();
					
					// Disconnect firebase connection as we dont' need it anymore
					Firebase.goOffline();
				}, function (errorObject) {
				  console.log("The read failed: " + errorObject.code);
				});
		
		  }
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
	// L.esri.dynamicMapLayer({
	// 	url: 'http://gis.brandon.ca/arcgis/rest/services/Juliet/propertySearch/MapServer',
	// 	transparent : true,
	// 	layers : [1,2,4,8,10],
	// 	imageSR : 26914
	// }).addTo(map).bringToFront();
	
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
		polygon.addTo(map).bringToFront();
		// fit the map to around the polygon
		map.fitBounds(polygon.getBounds());
	});
}

function style(feature) {
    return {
        fillColor: 'white',
        weight: 2,
        opacity: 0.6,
        color: 'white',
        fillOpacity: 0.2
    };
}
function getAssessmentHTML(rollNo) {
	return new Promise(function(resolve,reject) {
			// loads MB Gov assessment website and searches (based on Municipality Brandon) for roll no
			// Does some fancy viewstate passing to work with their .net server.
			var assessmentURL = 'http://www.mattkiazyk.com/bites/005/assess.php?type=json&roll=' + rollNo;
			$.get(assessmentURL, function( data ) {
				resolve(data);
			});
	});
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