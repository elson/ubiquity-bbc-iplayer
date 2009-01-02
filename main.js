
// Subscribe to these commands at http://github.com/elson/ubiquity-bbc-iplayer/wikis
// Usage: watch (programme)

// CONSTANTS
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
  "http://www.bbc.co.uk/bbchd/programmes/schedules/today.json",
  "http://www.bbc.co.uk/bbchd/programmes/schedules/yesterday.json"
];

// NOUN_TYPES
// ######################################################

// BBC TV channels
var noun_type_channels = new CmdUtils.NounType( "channel",
  ["bbcone", "bbctwo", "bbcthree", "bbcfour"]
);


// Recent BBC programmes available on iPlayer
var noun_type_progs = {
  _name: "BBC Programmes",
  suggest: function( text, html, callback ) {
    getProgs( TV_PROG_FEEDS, text, function( prog ) {
      callback( CmdUtils.makeSugg( prog.title, prog.title, prog ) );
    });
    return [];
  }
};


// COMMANDS
// ######################################################

// avail iplayer img sizes: 640_360, 512_288, 303_170, 150_84
// avail brand img sizes: 124_90, 100_73, 50_36

CmdUtils.CreateCommand({
  name: "watch",
  description: "Search for recent programmes on BBC iPlayer",
  homepage: "http://github.com/elson/ubiquity-bbc-iplayer/wikis",
  author: { name: "Stephen Elson", email: "stephen.elson@gmail.com" },
  icon: "http://www.bbc.co.uk/favicon.ico",
  license: "MPL",
  
  takes: {"programme": noun_type_progs},

  preview: function( pblock, prog ) {
    if (!pblock) return;

    pblock.innerHTML = "Watch a recent programme on BBC iPlayer";
    
    if (prog && prog.data) {
      var msg = '<img src="http://www.bbc.co.uk/ui/ide/1/images/brand/50/' + 
        'bbc_${servicenum}.gif" /><br /> ' + 
        (prog.data.subtitle ? '${subtitle}:<br />' : '') +
        '${synopsis} (${remaining})<br />' + 
        '<img src="${image}" width="512" height="288" />';

      pblock.innerHTML = CmdUtils.renderTemplate( msg, prog.data ); 
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
          displayMessage("Problem loading data");
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
  
  return {
    "pid": broadcast.programme.pid,
    "start": getW3Date(broadcast.start),
    "end": getW3Date(broadcast.end),
    "title": broadcast.programme.display_titles.title,
    "subtitle": broadcast.programme.display_titles.subtitle,
    "synopsis": broadcast.programme.short_synopsis,
    "remaining": broadcast.programme.media.availability.
      substr(0, broadcast.programme.media.availability.indexOf(" to")),
    "url": "http://www.bbc.co.uk/iplayer/episode/" + broadcast.programme.pid,
    "playlist": "http://www.bbc.co.uk/iplayer/playlist/"  + broadcast.programme.pid,
    "image": "http://www.bbc.co.uk/iplayer/images/episode/" + broadcast.programme.pid + "_512_288.jpg",
    "service": service.key,
    "channel": service.title,
    "servicenum": service.key.substr(3)
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


