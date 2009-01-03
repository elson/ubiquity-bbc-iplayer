
// Subscribe to these commands at http://github.com/elson/ubiquity-bbc-iplayer/wikis/command-feed
// Usage: 
//    watch (tv programme)
//    listen (radio programme)


// VARIABLES
// ######################################################

const TV_PROG_FEEDS = [
  "http://www.bbc.co.uk/bbcone/programmes/schedules/london/today.json",
  "http://www.bbc.co.uk/bbcone/programmes/schedules/london/yesterday.json",
  "http://www.bbc.co.uk/bbctwo/programmes/schedules/england/today.json",
  "http://www.bbc.co.uk/bbctwo/programmes/schedules/england/yesterday.json",
  "http://www.bbc.co.uk/bbcthree/programmes/schedules/today.json",
  "http://www.bbc.co.uk/bbcthree/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/bbcfour/programmes/schedules/today.json",
  "http://www.bbc.co.uk/bbcfour/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/bbcnews/programmes/schedules/today.json",
  "http://www.bbc.co.uk/bbcnews/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/cbbc/programmes/schedules/today.json",
  "http://www.bbc.co.uk/cbbc/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/cbeebies/programmes/schedules/today.json",
  "http://www.bbc.co.uk/cbeebies/programmes/schedules/yesterday.json"
];

const RADIO_PROG_FEEDS = [
  "http://www.bbc.co.uk/radio1/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio1/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/radio2/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio2/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/radio3/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio3/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/radio4/programmes/schedules/fm/today.json",
  "http://www.bbc.co.uk/radio4/programmes/schedules/fm/yesterday.json",
  "http://www.bbc.co.uk/radio7/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio7/programmes/schedules/yesterday.json"
];

const STATION_ICONS = {
  bbcone: "bbc_one.png",
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
  radio7: "bbc_7.png"
};

// Based loosely on Gray Nortons Freebase previews
// http://graynorton.com/ubiquity/freebase-nouns.html
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
    <img src="${image}" class="thumb" />\
    <img alt="${station}" width="86" height="37" class="station" \
      src="http://www.bbc.co.uk/iplayer/img/station_logos/small/${station_icon}" />\
    <h2>${title}</h2>\
    {if subtitle}\
      <h3>${subtitle}</h3>\
    {/if}\
    <p class="date">${shown}</p>\
    <p>${synopsis} (${remaining})</p>\
    <div id="links"></div>\
  </div>';

// NOUN_TYPES
// ######################################################

// BBC TV stations
var noun_type_tv_stations = new CmdUtils.NounType( "station",
  ["bbcone", "bbctwo", "bbcthree", "bbcfour"]
);


// Recent BBC TV programmes available on iPlayer
var noun_type_tv_progs = {
  _name: "BBC TV Programmes",
  suggest: function( text, html, callback ) {
    getProgs( TV_PROG_FEEDS, text, function( prog ) {
      callback( CmdUtils.makeSugg( prog.title, prog.title, prog ) );
    });
    return [];
  }
};


// Recent BBC Radio programmes available on iPlayer
var noun_type_radio_progs = {
  _name: "BBC Radio Programmes",
  suggest: function( text, html, callback ) {
    getProgs( RADIO_PROG_FEEDS, text, function( prog ) {
      callback( CmdUtils.makeSugg( prog.title, prog.title, prog ) );
    });
    return [];
  }
};


// COMMANDS
// ######################################################

CmdUtils.CreateCommand({
  name: "watch",
  description: "Search for recent television programmes on BBC iPlayer",
  homepage: "http://github.com/elson/ubiquity-bbc-iplayer/wikis/home",
  author: { name: "Stephen Elson", email: "stephen.elson@gmail.com" },
  icon: "http://www.bbc.co.uk/favicon.ico",
  license: "MPL",
  
  takes: { "tv programme": noun_type_tv_progs },

  preview: function( pblock, prog ) {
    if (!pblock) return;

    pblock.innerHTML = "Watch a recent TV programme on BBC iPlayer";
    
    if (prog && prog.data) {
      pblock.innerHTML = CmdUtils.renderTemplate( PREVIEW_TMPL, prog.data ); 
    }
  },

  execute: function( prog ) {
    Utils.openUrlInBrowser(prog.data.url);
  }
});


CmdUtils.CreateCommand({
  name: "listen",
  description: "Search for recent Radio programmes on BBC iPlayer",
  homepage: "http://github.com/elson/ubiquity-bbc-iplayer/wikis/home",
  author: { name: "Stephen Elson", email: "stephen.elson@gmail.com" },
  icon: "http://www.bbc.co.uk/favicon.ico",
  license: "MPL",
  
  takes: { "radio programme": noun_type_radio_progs },

  preview: function( pblock, prog ) {
    if (!pblock) return;

    pblock.innerHTML = "Listen to a recent Radio programme on BBC iPlayer";
    
    if (prog && prog.data) {
      pblock.innerHTML = CmdUtils.renderTemplate( PREVIEW_TMPL, prog.data ); 
    }
  },

  execute: function( prog ) {
    Utils.openUrlInBrowser(prog.data.url);
  }
});

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
    prog = flattenProg( broadcast, json.schedule.service );
    if ( prog && prog.title.match(query, "i") ) {
        callback(prog);
    }
  });
}


function flattenProg( broadcast, service ) {

  if (!broadcast.programme.media) 
    return null;
  
  // avail holding img sizes: 640_360, 512_288, 303_170, 150_84
  return {
    "pid": broadcast.programme.pid,
    "start": getW3Date(broadcast.start),
    "end": getW3Date(broadcast.end),
    "shown": formatDate(broadcast.start),
    "title": broadcast.programme.display_titles.title,
    "subtitle": broadcast.programme.display_titles.subtitle,
    "synopsis": broadcast.programme.short_synopsis,
    "remaining": broadcast.programme.media.availability.
      substr(0, broadcast.programme.media.availability.indexOf(" to")),
    "url": "http://www.bbc.co.uk/iplayer/episode/" + broadcast.programme.pid,
    "playlist": "http://www.bbc.co.uk/iplayer/playlist/"  + broadcast.programme.pid,
    "image": "http://www.bbc.co.uk/iplayer/images/episode/" + broadcast.programme.pid + "_303_170.jpg",
    "type": service.type,
    "station": service.title,
    "station_id": service.key,
    "station_icon": STATION_ICONS[service.key]
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

