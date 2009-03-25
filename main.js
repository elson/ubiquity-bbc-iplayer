/*
  Subscribe to these commands at:
  http://github.com/elson/ubiquity-bbc-iplayer/wikis/command-feed
  
  Version:
    0.2.1
  
  Usage:
    watch (tv programme name)
    listen (radio programme name)
    
    You can filter programmes by tpying "todays" or "yesterdays" before the 
    programme name. This is quite basic for now but will be improved in 
    future versions.
  
  Credits:
    Some aspects based on Gray Nortons Freebase previews
    http://graynorton.com/ubiquity/freebase-nouns.html
*/

const TYPE_TV = "tv";
const TYPE_RADIO = "radio";


/**
  @namespace Schedule
  Static for dealing with programme schedules
*/
var Schedule = function () {

  // Private

  var CACHE = {};
  
  const STATIONS = {
    "tv": {
      "bbcone": { img: "bbc_one.png", outlet: "london" },
      "bbctwo": { img: "bbc_two.png", outlet: "england" },
      "bbcthree": { img: "bbc_three.png" },
      "bbcfour": { img: "bbc_four.png" },
      "bbcnews": { img: "bbc_news24.png" },
      "cbbc": { img: "cbbc.png" },
      "cbeebies": { img: "cbeebies.png" }
    },
    "radio": {
      "radio1": { img: "bbc_radio_one.png" },
      "1xtra": { img: "bbc_1xtra.png" },
      "radio2": { img: "bbc_radio_two.png" },
      "radio3": { img: "bbc_radio_three.png" },
      "radio4": { img: "bbc_radio_four.png", outlet: "fm" },
      "fivelive": { img: "bbc_radio_five_live.png" },
      "5livesportsextra": { img: "bbc_radio_five_live_sports_extra.png" },
      "6music": { img: "bbc_6music.png" },
      "radio7": { img: "bbc_7.png" },
      "asiannetwork": { img: "bbc_asian_network.png" },
      "worldservice": { img: "bbc_world_service.png" }
    }
  };

  /**
    @function getFeedUrls
    @private
    Returns array of feed URLs for BBC TV & Radio stations
  */
  function getFeedURLs ( query ) {

    var feeds = [], base;
    var stations = STATIONS[query.type];

    jQuery.each( stations, function( name, station ) {
      base = "http://www.bbc.co.uk/" + name +
        "/programmes/schedules/" + (station.outlet ? station.outlet + "/" : "");
      if (query.date == "" || query.date == "todays") { 
        feeds.push( base + "today.json" );
      }
      if (query.date == "" || query.date == "yesterdays") {
        feeds.push( base + "yesterday.json" );
      }
    });

    return feeds;
  }

  /**
    @function filter
    @private
    For a schedule pass only the broadcasts matching query to func
  */
  function filter ( schedule, query, func ) {
    var pids = {}, station, prog;

    schedule.day.broadcasts.forEach( function( broadcast ) {
      if ( !pids[broadcast.programme.pid] && Broadcast.check( broadcast, query ) ) {
        pids[broadcast.programme.pid] = true;
        station = STATIONS[query.type][schedule.service.key];
        broadcast._service =  schedule.service;
        broadcast._service.img = station.img;
        func(broadcast);
      }
    });
  }

  // Public

  return {

    /**
      @function Schedule.find
      Finds broadcasts matching Query obj, calls func for each hit
    */
    find: function ( query, func ) {
      var urls = getFeedURLs( query );

      urls.forEach( function( url ) {
        if ( CACHE[url] ) {
          filter( CACHE[url], query, func );
        }
        else {
          jQuery.ajax( {
            url: url,
            dataType: "json",
            success: function( json ){
              CACHE[url] = json.schedule;
              filter( CACHE[url], query, func );
            },
            error: function() {
              CmdUtils.log("Problem loading: " + url);
            }
          });
        }
      });
    }
    
  };

}();


/**
  @namespace Broadcast
  @description Functions for working with programmes
*/
var Broadcast = function () {

  // Private

  // Avail holding img sizes: 640_360, 512_288, 303_170, 150_84
  const TEMPLATE = '\
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

  /**
    @function getW3Date
    @private
    Returns a Date object of strings in format 2009-01-04T07:00:00Z
    Modified from http://delete.me.uk/2005/03/iso8601.html
  */
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

  /**
    @function formatDate
    @private
    Returns human readable version of a date.
  */
  function formatDate (string) {
    var date = getW3Date(string);
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    var _hours = date.getHours();
    var _minutes = date.getMinutes();
    var _date = date.getDate();
    var hours = (_hours % 12 === 0) ? "12" : _hours % 12;
    var minutes = _minutes < 10 ? "0" + _minutes : _minutes;
    var period = _hours < 12 ? "am" : "pm";
    var suffix = "th";
    
    if ( _date == 1 || _date == 21 || _date == 31 ) { suffix = "st"; }
    if ( _date == 2 || _date == 22 ) { suffix = "nd"; }

    return [ hours, ".", minutes, period, " ", days[date.getDay()],
      " ", _date, suffix, " ", months[date.getMonth()] ].join("");
  }

  // Public

  return {
    create: function ( broadcast ) {

    },

    /**
      @function Broadcast.check
      Returns true if a broadcast is available and title matches query.regexp
    */
    check: function ( broadcast, query ) {
      return !!broadcast.programme.media && 
          query.expr.test(broadcast.programme.display_titles.title);
    },
    
    /**
      @function Broadcast.render
      Returns broadcast details as an HTML string
    */
    render: function ( broadcast ) {
      broadcast._shown = formatDate(broadcast.start);

      return CmdUtils.renderTemplate( TEMPLATE, broadcast )
    }
  };

}(); // End Broadcast


/**
  @namespace Query
  @description Functions for parsing natural language expression
*/
var Query = function () {

  // Public

  return {
  
    /**
      @function create
      Returns a query object containing text, expr, type, station, genre, date
    */
    create: function ( text, opts ) {
    
      var query = jQuery.extend({
        "text": text, 
        expr: new RegExp(text, "i"),
        type: TYPE_TV, 
        station: "",
        genre: "", 
        date: ""
        }, opts 
      );
      var words = text.split(" ");
      var startsWith = false;

      words.forEach( function( word, index ) {
        if (word == "todays" || word == "yesterdays") {
          query.date = word;
          if ( index === 0 ) { startsWith = true; }
        }
      });

      if ( startsWith ) { 
          query.text = words.slice(1).join(" ");
          query.expr = new RegExp(query.text, "i");
      }

      return query;
    }
    
  };

}(); // End Query


/**
  @namespace UbiqHelper
  Ubiquity helper functions
*/
var UbiqHelper = function () {

  // Private
  
  function Slow ( delay ) {
    var timer = null;
    if ( !delay ) { delay = 400; }
    this.please = function ( func ) {
      if (timer) { Utils.clearTimeout( timer ); }
      timer = Utils.setTimeout ( function() {
        timer = null;
        func();
      }, delay );
    };
  }
  // Public

  return  {

    /**
      @function UbiqHelper.createNoun
      Create a Ubiquity noun type
    */
    createNoun: function ( name, tv_or_radio ) {
      
      var slowly = new Slow();

      return {
        _name: name,
        suggest: function( text, html, callback ) {
          var query, title;

          if ( text.length < 2) { return []; }

          slowly.please( function() {
            query = Query.create(text, { type: tv_or_radio });
            Schedule.find( query, function( broadcast ) {
              title = broadcast.programme.display_titles.title;
              callback( CmdUtils.makeSugg( title, title, broadcast ) );
            });
          });

          return [];
        }
      };
    },

    /**
      @function UbiqHelper.createCommand
      Create a Ubiquity command
    */
    createCommand: function ( name, description, takes ) {

      CmdUtils.CreateCommand({
        name: name,
        description: description,
        homepage: "http://github.com/elson/ubiquity-bbc-iplayer/wikis/home",
        author: { name: "Stephen Elson", email: "stephen.elson@gmail.com" },
        icon: "http://www.bbc.co.uk/favicon.ico",
        license: "MIT",
        takes: takes,

        preview: function( el, item ) {
          if (!el) { return; }

          el.innerHTML = description;
          if (item && item.data) {
            el.innerHTML = Broadcast.render( item.data );
          }
        },

        execute: function( item ) {
          Utils.openUrlInBrowser("http://www.bbc.co.uk/iplayer/episode/" + 
            item.data.programme.pid);
        }
      });
      
    }
    
  };

}(); // End UbiqHelper


// Initialise nouns and commands
// ######################################################

// Recent BBC TV programmes available on iPlayer
var noun_type_tv_progs = UbiqHelper.createNoun(
  "BBC TV Programmes",
  TYPE_TV
);

// Recent BBC Radio programmes available on iPlayer
var noun_type_radio_progs = UbiqHelper.createNoun(
  "BBC Radio Programmes",
  TYPE_RADIO
);

// Watch BBC TV programmes
UbiqHelper.createCommand(
  "watch",
  "Watch a recent TV programme on BBC iPlayer", {
  "tv programme": noun_type_tv_progs
});

// Listen to BBC Radio programmes
UbiqHelper.createCommand(
  "listen",
  "Listen to a recent Radio programme on BBC iPlayer", {
  "radio programme": noun_type_radio_progs
});
