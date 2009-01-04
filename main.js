
// Subscribe to these commands at http://github.com/elson/ubiquity-bbc-iplayer/wikis/command-feed
// Usage: 
//    watch (tv programme)
//    listen (radio programme)


// CONSTANTS
// ######################################################

const TV_PROG_FEEDS = iPlayerFeeds ([
  { service: "bbcone", outlet: "london" },
  { service: "bbctwo", outlet: "england" },
  { service: "bbcthree" },
  { service: "bbcfour" },
  { service: "bbcnews" },
  { service: "cbbc" },
  { service: "cbeebies" }
]);

const RADIO_PROG_FEEDS = iPlayerFeeds ([
  { service: "radio1" },
  { service: "1xtra" },
  { service: "radio2" },
  { service: "radio3" },
  { service: "radio4", outlet: "fm" },
  { service: "fivelive" },
  { service: "5livesportsextra" },
  { service: "6music" },
  { service: "radio7" },
  { service: "asiannetwork" },
  { service: "worldservice" }
]);

const STATION_ICONS = {
  bbcone: "bbc_one.png",
  "1xtra": "bbc_1xtra.png",
  bbctwo: "bbc_two.png",
  bbcthree: "bbc_three.png",
  bbcfour: "bbc_four.png",
  bbcnews: "bbc_news24.png",
  cbbc: "cbbc.png",
  cbeebies: "cbeebies.png",
  radio1: "bbc_radio_one.png",
  radio2: "bbc_radio_two.png",
  radio3: "bbc_radio_three.png",
  radio4: "bbc_radio_four.png",
  fivelive: "bbc_radio_five_live.png",
  "5livesportsextra": "bbc_radio_five_live_sports_extra.png",
  "6music": "bbc_6music.png",
  radio7: "bbc_7.png",
  asiannetwork: "bbc_asian_network.png",
  worldservice: "bbc_world_service.png"
};

// Based loosely on Gray Nortons Freebase previews
// http://graynorton.com/ubiquity/freebase-nouns.html
// Avail holding img sizes: 640_360, 512_288, 303_170, 150_84
const PREVIEW_TMPL = '\
  <style>\
  .wrapper { font-size: 12px; font-family:  Calibri, Arial, sans-serif; \
    padding: 1em 0; background:white; color:black }\
  .thumb { float: right; padding: 0 1em 1em 1em; }\
  #links { clear:both }\
  h2 { font-size: 1.5em; margin:.5em 0 0 .5em }\
  h3 { color: #888; font-size: 1em; font-weight: normal; margin:0 0 0 .67em }\
  p, .station { margin-left: .67em }\
  </style>\
  <div class="wrapper">\
    <img src="http://www.bbc.co.uk/iplayer/images/episode/${programme.pid}_303_170.jpg" \
    width="303" height="170" alt="${programme.display_titles.title}"class="thumb" />\
    <img alt="${_service.title}" width="86" height="37" class="station" \
      src="http://www.bbc.co.uk/iplayer/img/station_logos/small/${_service.img}" />\
    <h2>${programme.display_titles.title}</h2>\
    {if programme.display_titles.subtitle}\
      <h3>${programme.display_titles.subtitle}</h3>\
    {/if}\
    <p class="date">${_shown}</p>\
    <p>${programme.short_synopsis} (${programme.media.availability.replace(/.to.*$/, "")})</p>\
    <div id="links"></div>\
  </div>';


// NOUN_TYPES
// ######################################################

// Recent BBC TV programmes available on iPlayer
var noun_type_tv_progs = iPlayerNounType( "BBC TV Programmes", TV_PROG_FEEDS );

// Recent BBC Radio programmes available on iPlayer
var noun_type_radio_progs = iPlayerNounType( "BBC Radio Programmes", RADIO_PROG_FEEDS );


// COMMANDS
// ######################################################

// Watch BBC TV programmes
iPlayerCommand( 
  "watch", 
  "Watch a recent TV programme on BBC iPlayer", {
  "tv programme": noun_type_tv_progs
});


// Listen to BBC Radio programmes
iPlayerCommand( 
  "listen", 
  "Listen to a recent Radio programme on BBC iPlayer", {
  "radio programme": noun_type_radio_progs
});


// FACTORIES
// ######################################################

// Creates BBC TV & Radio programme noun_types from feeds
function iPlayerNounType ( name, feeds ) {

  var slowly = new Slow();
  
  return {
    _name: name,
    suggest: function( text, html, callback ) {
      slowly.please( function() {
        getProgs( feeds, text, function( broadcast, title ) {
          callback( CmdUtils.makeSugg( title, title, broadcast ) );
        });
      });
      return [];
    }
  };
}

// Creates commands using programme noun_types
function iPlayerCommand ( name, description, takes ) {

  CmdUtils.CreateCommand({
    name: name,
    description: description,
    homepage: "http://github.com/elson/ubiquity-bbc-iplayer/wikis/home",
    author: { name: "Stephen Elson", email: "stephen.elson@gmail.com" },
    icon: "http://www.bbc.co.uk/favicon.ico",
    license: "MIT",
    takes: takes,
    
    preview: function( pblock, item ) {
      if (!pblock) { return; }

      pblock.innerHTML = description;
      if (item && item.data) {
        var broadcast = item.data;
        broadcast._service.img = STATION_ICONS[broadcast._service.key];
        broadcast._shown = formatDate(broadcast.start);
        pblock.innerHTML = CmdUtils.renderTemplate( PREVIEW_TMPL, broadcast );
      }
    },
    
    execute: function( item ) {
      Utils.openUrlInBrowser("http://www.bbc.co.uk/iplayer/episode/" + item.data.programme.pid);
    }
  });
}

// Returns array of feed URLs for BBC TV & Radio stations 
function iPlayerFeeds ( config ) {
  
  var feeds = [], base;
  
  config.forEach( function( item ){
    base = "http://www.bbc.co.uk/" + item.service +
      "/programmes/schedules/" + (item.outlet ? item.outlet + "/" : "");
    feeds.push( base + "today.json" );
    feeds.push( base + "yesterday.json" );
  });
  
  return feeds;
}

// UTILITIES
// ######################################################

var cache = {};

function getProgs( feeds, query, callback){
  feeds.forEach( function( feed ) {
    if ( cache[feed] ) {
      matchProgs( cache[feed], query, callback );
    }
    else {
      jQuery.ajax( {
        url: feed,
        dataType: "json",
        success: function( json ){
          cache[feed] = json;
          matchProgs( json, query, callback );
        },
        error: function() {
          CmdUtils.log("Problem loading: " + feed);
        }
      });
    }
  });
}


function matchProgs( json, query, callback ) {
  json.schedule.day.broadcasts.forEach( function( broadcast ) {
    if ( broadcast.programme.media && 
      broadcast.programme.display_titles.title.match(query, "i") ) {
        broadcast._service = json.schedule.service;
        callback(broadcast, broadcast.programme.display_titles.title);
    }
  });
}


// Used by noun_types to prevent too many http requests
// Based loosely on Gray Nortons Freebase
// http://graynorton.com/ubiquity/freebase-nouns.html
function Slow ( delay ) {
  var timer = null;
  
  if ( !delay ) { delay = 400; }
  
  this.please = function ( fn ) {
    if (timer) { Utils.clearTimeout( timer ); }
        
    timer = Utils.setTimeout ( function() {
      timer = null;
      fn();
    }, delay );
  };
}


// getW3Date modified from http://delete.me.uk/2005/03/iso8601.html
function getW3Date (string) {
  var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
    "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
    "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
  var d = string.match(new RegExp(regexp));
  var date = new Date(d[1], 0, 1);
  if (d[3]) { date.setMonth(d[3] - 1); }
  if (d[5]) { date.setDate(d[5]); }
  if (d[7]) { date.setHours(d[7]); }
  if (d[8]) { date.setMinutes(d[8]); }
  if (d[10]) { date.setSeconds(d[10]); }
  if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }

  return date;
}


function formatDate (string) {
  var date = getW3Date(string);
  var days = [null, "Monday", "Tuesday", "Wedmesday", 
    "Thursday", "Friday", "Saturday", "Sunday"];
  var months = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];
  var _hours = date.getHours();
  var _minutes = date.getMinutes();
  var hours = (_hours % 12 === 0) ? "12" : _hours % 12;
  var minutes = _minutes < 10 ? "0" + _minutes : _minutes;
  var period = _hours < 12 ? "am" : "pm";
    
  return [ hours, ".", minutes, period, " ", days[date.getDay()], 
    " ", date.getDate(), " ", months[date.getMonth()] ].join("");
}

