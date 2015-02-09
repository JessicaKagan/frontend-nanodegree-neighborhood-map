/*
Possible function for later: Perform "traveling salesman" algorithm on user selected locations to find
the shortest route between all of them.
APIs to implement:
Some sort of weather API (like Weather Channel/Underground, but that has fairly low usage caps)
A travel API?
News from locations
*/

//Globals.
var map = "";
var searchPrompt = "";
var contentWindow = new google.maps.InfoWindow({
    content: "Debug",
});
var redditHTML;
var wikiHTML;
var photoURL;
var photoList;
var pictureService;
var placeDetails;


//Takes an item from locationList and preps it for display by running some API calls.
//If we get this from Google Maps API requests, that might help out a bit.
var neighborhoodLocation = function(name, lat, lng, contentString) {
    var self = this; //I assume this has to be done to hook things into Knockout.js
    self.name = name;
    self.lat = lat;
    self.lng = lng;

    //Placeholder. Later, if we don't have a coordinate, try to get something from geocoding.
    if(lat = undefined) { lat = 0;}
    if(lng = undefined) { lng = 0;}


    //The initial comment string is a personal comment on the area.
    //Expand content string to include API pulls, HTML, etc. and such.
    self.contentString =  contentString;

    //Now for variables derived from the initial ones, and from other sources.
    self.locationMarker = new google.maps.Marker({
        title: this.name,
        position: {lat: this.lat, lng: this.lng,},
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    });

}


//Create a function that converts Google Maps API data into these?
var locationList = [
    new neighborhoodLocation("Boston",42.3283505,-71.0605903,"Filler"),
    new neighborhoodLocation("New York",40.7033121,-73.979681,"Only ever been to upstate New York."),
    new neighborhoodLocation("Philadelphia",40.0047528,-75.1180329,"Filler"),
    new neighborhoodLocation("Atlanta",33.7677129,-84.420604,"Sure, why not?"),
    new neighborhoodLocation("New Orleans",30.0219504,-89.8830829,"Just not during hurricane season..."),
    //Get coords for: Toronto, Montreal, Chicago, Austin, Portland, Seattle, Vancouver,
    //Rio de Janeiro, Montevideo, Buenos Aires, Valparaiso, Cusco
    //Dublin, London, Brussels, Amsterdam, Frankfurt, Hamburg, Berlin
    //Copenhagen, Gothenburg, Oslo, Stockholm, Helsinki, Saint Petersburg,
    //Gdansk, Warsaw, Krakow, Prague, Budapest, Vienna, Zurich, Milan, Rome
    //Istanbul, Damascus, Tel Aviv, Cairo, Tunis, Algiers, Tangier, Casablanca
    //Moscow, Kazan, Yekaterinburg, Novosibirsk, Irkutsk, Vladivostok, Magadan
    //Seoul, Tokyo, Osaka, Harbin, Nanjing, Taipei, Xiamen, Urumqi, Ulaanbaatar
    //Add more locations like Central Asia, India, Southeast Asia, Australia/NZ, Subsaharan Africa

];

//Knockoutify this? More importantly, make this a method of neighborhoodLocation?
function addMarker(neighborhoodLocation) {

    this.name = neighborhoodLocation.name;
    this.lat = neighborhoodLocation.lat;
    this.lng = neighborhoodLocation.lng;
    this.locationMarker = neighborhoodLocation.locationMarker;

    locationMarker.setMap(map);
    google.maps.event.addListener(locationMarker, 'click', function() {
        moveWindow(neighborhoodLocation);
        
    });
}

//moveWindow gets the content and position from the location, and attaches to the marker.
function moveWindow(neighborhoodLocation) {
    this.name = neighborhoodLocation.name;
    this.contentString = neighborhoodLocation.contentString;
    this.locationMarker = neighborhoodLocation.locationMarker;
    this.lat = neighborhoodLocation.lat;
    this.lng = neighborhoodLocation.lng;

    //We'll add an image to this later.
    contentString = '<div id="infoWindow"> <p>' + contentString + '</p> </div>';
    console.log(contentString);

    //Makes some AJAX requests.
    getRedditData(neighborhoodLocation);
    getWikipediaPage(neighborhoodLocation);

    //Data and function for a request to the Google Places API
    var pictureRequest = {
        location: {lat: this.lat, lng: this.lng,},
        radius: '5000',
        name: name,
    }
    pictureService = new google.maps.places.PlacesService(map);
    pictureService.nearbySearch(pictureRequest, getLocalLandmark);

    contentWindow.setContent(contentString);
    //Adding slightly to the latitude makes things look a little better.
    contentWindow.setPosition({lat: (locationMarker.position.lat() + 0.002), lng: locationMarker.position.lng()});

    contentWindow.open(map);
}

function getLocalLandmark(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        var place = results[0];
        console.log(place);
        //If we get a place and a photo at all, then it's time to construct a request and add it to the page.
        //See https://developers.google.com/places/documentation/photos.
        if(place.photos != undefined){
            photoList = place.photos[0];
            console.log(photoList);
            photoURL = 'http://maps.googleapis.com/maps/api/place/photo?maxwidth=400&' +
            'photoreference=' + photoList +
            "&key=AIzaSyCeG1ftdGJnxx6m8lN_qrS1NrOIoXD1Vz4";
            $("#infoWindow").append('<img src = "' + photoURL + '" alt="Image from Google Places API">');
        }else { $("#infoWindow").append('No image, beautify this error'); }

        console.log($("#infoWindow").html());
        return place;
    } //Add a failure image of some sort for usability's sake
}

//Note things from here at that point: http://stackoverflow.com/questions/15317796/knockout-loses-bindings-when-google-maps-api-v3-info-window-is-closed
//Based on http://speckyboy.com/2014/01/22/building-simple-reddit-api-webapp-using-jquery/
//Use this link to make callbacks for this and the Wiki function work properly:
//http://stackoverflow.com/questions/14220321/how-to-return-the-response-from-an-ajax-call
function getRedditData(neighborhoodLocation) {
    this.name = neighborhoodLocation.name;
    //Pull five posts mentioning our location from Reddit's "travel" API
    var redditRequestURL = "http://www.reddit.com/r/travel/search.json?q=" + name + "&limit=5&sort=relevance&restrict_sr=0";
    var redditConstructor = "If you see this message, debug the Reddit functions.";
    $.getJSON(redditRequestURL, function(postSet){
        redditConstructor = "";
        var listing = postSet.data.children;
        //Iterate through the list and get some tags we can put in the HTML.
        for(var i = 0; i < listing.length; i++) {
            var obj = listing[i].data;
            var title = obj.title;
            //var subtime = obj.created_utc;
            var votes = obj.score;
            var redditurl = "http://www.reddit.com"+obj.permalink;
            //Create the HTML tags we need
            redditConstructor += '<li><a href="' + redditurl +'">' + title + '</a></li>';
            
        }
        //console.log(redditConstructor);
    }).done(function() { SearchViewModel.redditHTML(redditConstructor); });
}

function getWikipediaPage(neighborhoodLocation) {
    this.name = neighborhoodLocation.name;
    wikiHTML = ""; //Cleanup
    var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + name + '&format=json&callback=wikiCallback';
    //Uncomment and modify when ready to set a timeout.
    //var wikiRequestTimeout = setTimeout(function(){
    //    wikiHTML = "Sorry, we didn't manage to get a Wikipedia page for this place.";
    //}, 8000);
    $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        jsonp: "callback",
        success: function( response ) {
            //console.log(response);
            //Variable defines for sanity and overall code readability.
            var mainArticle = response[1][0];
            var articleExcerpt = response[2][0];
            var articleURL = response[3][0];
            wikiHTML = "<div id='wikiData'><a href='" + articleURL + "'>" + mainArticle + "</a> - " +
                "<p>" + articleExcerpt + "</p>";
            //console.log(wikiHTML);

            //clearTimeout(wikiRequestTimeout);
        }
    }).done(function() { SearchViewModel.wikiHTML(wikiHTML); });
}

function initialize() {
    var mapOptions = {
        center: { lat: 40.7033121, lng: -73.979681},
        zoom: 4
        };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    //var infowindow = new google.maps.infoWindow({
    //    content: "Test",
    //});

    //Turn this into a Knockout observable array, and use a push function to add further stuff?
    //Add more things to the markers.
    //Displays the markers and populates the HTML list. 
    for(var i=0;i<locationList.length;++i)
    {
        addMarker(locationList[i]);
    }
    for(var i=0;i<locationList.length;++i)
    {
        SearchViewModel.HTMLLocs.push(locationList[i].name);
    }

}

//This might need to be merged into a "controller" with showCorrespondingMarker below.
//Implementation cribbed from http://opensoul.org/2011/06/23/live-search-with-knockoutjs/
var SearchViewModel = {
    searchPrompt: ko.observable(""),
    HTMLLocs: ko.observableArray(),
    searchFilter: ko.observableArray(locationList),
    redditHTML: ko.observable(""),
    wikiHTML: ko.observable(""),
    //The way the applet is built now, you don't add new locations.
    search: function(value){
        //console.log(value);
        SearchViewModel.searchFilter([]);
        for(var x in locationList)
        {
            //The actual search here. If we find anything, print it to the page.
            if(locationList[x].name.toLowerCase().indexOf(value.toLowerCase()) >= 0){

                SearchViewModel.searchFilter.push(locationList[x]);
            }
        }
        //console.log(SearchViewModel.searchFilter()); //Outputs a valid array that needs to be formatted for output.
    },
}

function showCorrespondingMarker() {
    //First, reset the marker coloration.
    for(var x in locationList)
    {
        locationList[x].locationMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
    }

    //This returns a DOM element, but rewrite it to use KnockoutJS's methods.
    var optionMarker = document.getElementById("locationOptions").value;
    //Get the corresponding index in our list of Google locations, using some prototype.map trickery.
    //Won't work in legacy browsers like IE8.
    var selectedMarker = locationList.map(function(e) { return e.name}).indexOf(optionMarker);

    /* Centers the camera and turns the corresponding marker blue (Initially green, but colorblind people would complain).
    Got some info from http://stackoverflow.com/questions/2818984/google-map-api-v3-center-zoom-on-displayed-markers; it might be irrelevant now.
    */
    if(selectedMarker != -1) {
        locationList[selectedMarker].locationMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
        map.setCenter({lat:locationList[selectedMarker].lat, lng:locationList[selectedMarker].lng});
    }
}


jQuery(function( $ ) {
    google.maps.event.addDomListener(window, 'load', initialize);
    ko.applyBindings(SearchViewModel);
    SearchViewModel.searchPrompt.subscribe(SearchViewModel.search);
});