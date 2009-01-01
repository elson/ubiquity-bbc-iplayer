

// NOUN_TYPES
// ######################################################

// BBC TV channels
var noun_type_channels = new CmdUtils.NounType( "channel",
  ["bbcone", "bbctwo", "bbcthree", "bbcfour"]
);

// Recent BBC One shows on iPlayer
var noun_type_progs = {
    _name: "BBC Programmes",
    responses: 0,
    downloading: false,
    list: [],
    feeds: [
        "http://www.bbc.co.uk/bbcone/programmes/schedules/london/today.json",
        "http://www.bbc.co.uk/bbcone/programmes/schedules/london/yesterday.json",
        "http://www.bbc.co.uk/bbctwo/programmes/schedules/england/today.json",
        "http://www.bbc.co.uk/bbctwo/programmes/schedules/england/yesterday.json",
        "http://www.bbc.co.uk/bbcthree/programmes/schedules/today.json",
        "http://www.bbc.co.uk/bbcthree/programmes/schedules/yesterday.json",
        "http://www.bbc.co.uk/bbcfour/programmes/schedules/today.json",
        "http://www.bbc.co.uk/bbcfour/programmes/schedules/yesterday.json"
    ],
    
    getProgs: function (){
        var np = noun_type_progs;
        
        if (np.downloading) return;
        
        np.downloading = true;
        np.feeds.forEach( function( feed ) {
            getFeed( feed, np.callback );
        });
    },
    
    callback: function ( response ) {
        var np = noun_type_progs;
        var broadcasts = response.schedule.day.broadcasts;
        var service = response.schedule.service;
        
        broadcasts.forEach( function( broadcast ) {
            if (broadcast.programme.media){
                np.list.push( np.simplify( broadcast, service ) );
            }
        });
        
        if ( np.responses++ === np.feeds.length ) {
            np.downloading = false;
            CmdUtils.log("downloaded " + np.responses + " feeds"); 
        }
    },
    
    simplify: function ( broadcast, service ) {
        return {
            "pid": broadcast.programme.pid,
            "start": getW3Date(broadcast.start),
            "end": getW3Date(broadcast.end),
            "title": broadcast.programme.display_titles.title,
            "subtitle": broadcast.programme.display_titles.subtitle,
            "synopsis": broadcast.programme.short_synopsis,
            "availability": broadcast.programme.media.availability.
                substr(0, broadcast.programme.media.availability.indexOf(" to")),
            "url": "http://www.bbc.co.uk/iplayer/episode/" + broadcast.programme.pid,
            "playlist": "http://www.bbc.co.uk/iplayer/playlist/"  + broadcast.programme.pid,
            "holdingimg": "http://www.bbc.co.uk/iplayer/images/episode/" + broadcast.programme.pid + "_512_288.jpg",
            "service": service.key,
            "channel": service.title,
            "servicenum": service.key.substr(3)
        };
    },
    
    suggest: function( text ) {
        var np = noun_type_progs;
        var suggestions = [];
        
        if ( np.responses !== np.feeds.length ) {
            np.getProgs();
            return suggestions;
        }
        
        if ( text.length < 3 ) return suggestions;
        
        np.list.forEach( function( prog ) {
            if ( prog.title.match(text, "i") ) {
                suggestions.push( CmdUtils.makeSugg(prog.title, prog.title, prog) );
            }
        });
        
        CmdUtils.log("Found " + suggestions.length + " suggestions");
        return suggestions;
    }
};



// COMMANDS
// ######################################################

// avail iplayer img sizes: 640_360, 512_288, 303_170, 150_84
// avail brand img sizes: 124_90, 100_73, 50_36

CmdUtils.CreateCommand({
    name: "watch",
	icon: "http://www.bbc.co.uk/favicon.ico",
	author: {name: "Stephen Elson", email: "stephen.elson@gmail.com"},
	license: "MPL",
	description: "Search for recent programmes on BBC iPlayer",
    takes: {"programme": noun_type_progs},
    
    preview: function( pblock, prog ) {
        if (!pblock) return;
        
        pblock.innerHTML = "Watch a recent programme on BBC iPlayer!";
        if (prog && prog.data) {
         var msg = '<img src="http://www.bbc.co.uk/ui/ide/1/images/brand/50/' + 
          'bbc_${servicenum}.gif" width="50" height="36" /><br /> ' + 
          (prog.data.subtitle ? '${subtitle}:<br />' : '') +
          '${synopsis} (${availability})<br />' + 
          '<img src="${holdingimg}" width="512" height="288" />' ;
            
            pblock.innerHTML = CmdUtils.renderTemplate( msg, prog.data ); 
        }
    }, 
    
    execute: function( prog ) {
        Utils.openUrlInBrowser(prog.data.url);
    }
});



// UTILITIES
// ######################################################

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

function getFeed ( feed, callback ) {
    jQuery.ajax( {
        url: feed,
        dataType: "json",
        success: callback,
        error: function() {
            displayMessage("Sorry, feed unavailable");
        }
    });
}


