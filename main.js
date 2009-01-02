
// Subscribe to these commands at http://github.com/elson/ubiquity-bbc-iplayer/wikis/home
// Usage: 
//    watch (tv programme)
//    listen (radio programme)


// VARIABLES
// ######################################################wi

var TV_PROG_FEEDS = [
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

var RADIO_PROG_FEEDS = [
  "http://www.bbc.co.uk/radio1/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio1/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/radio2/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio2/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/radio3/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio3/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/radio4/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio4/programmes/schedules/yesterday.json",
  "http://www.bbc.co.uk/radio7/programmes/schedules/today.json",
  "http://www.bbc.co.uk/radio7/programmes/schedules/yesterday.json"
];

// NOUN_TYPES
// ######################################################

// BBC TV channels
var noun_type_tv_channels = new CmdUtils.NounType( "channel",
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

// avail iplayer img sizes: 640_360, 512_288, 303_170, 150_84
// avail brand img sizes: 124_90, 100_73, 50_36

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
      var msg = '<img src="http://www.bbc.co.uk/ui/ide/1/images/brand/50/' + 
        'radio_${servicenum}.gif" /><br /> ' + 
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
          //CmdUtils.log("Problem loading: " + feed);
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
    "type": service.type,
    "service": service.key,
    "channel": service.title,
    "servicenum": (service.type == 'tv') ? service.key.substr(3) : service.key.substr(5)
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


