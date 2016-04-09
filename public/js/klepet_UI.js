function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = (sporocilo.match(/\bhttp:\/\//gi) || sporocilo.match(/\bhttps:\/\//gi)) && (sporocilo.match(/\b\.jpg\b/gi) || sporocilo.match(/\b\.png\b/gi) || sporocilo.match(/\b\.gif\b/gi));
  var jeVideo = (sporocilo.match(new RegExp('\\bhttps:\/\/www.youtube.com\/watch\\?v=\\S*\\b', 'gi')));
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } 
  else if(jeSlika || jeVideo) {
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }

  else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
      if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
      
      dodajSlike(sporocilo);
      addVideo(sporocilo);
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));

    dodajSlike(sporocilo);
    addVideo(sporocilo);
  }

  $('#poslji-sporocilo').val('');
  
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });
  
  socket.on('dregljaj', function(rezultat) {
    $('#vsebina').jrumble();
    $('#vsebina').trigger('startRumble');
    setTimeout(function(){
       $('#vsebina').trigger('stopRumble')
    }, 1500);
    
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);

    dodajSlike(sporocilo.besedilo);
    addVideo(sporocilo.besedilo);

  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
     $('#poslji-sporocilo').val('/zasebno "'+$(this).text()+'"');
     $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}


function dodajSlike(sporocilo) {
  var povezave = sporocilo.match(new RegExp('\\bhttps?:\/\/\\S*\\.(png|jpg|gif)\\b', 'gi')); 
  for(var i in povezave) {
    if(povezave[i] != 'http://sandbox.lavbic.net/teaching/OIS/gradivo/wink.png' && povezave[i] != 'http://sandbox.lavbic.net/teaching/OIS/gradivo/smiley.png' && povezave[i] != 'http://sandbox.lavbic.net/teaching/OIS/gradivo/like.png'
      && povezave[i] != 'http://sandbox.lavbic.net/teaching/OIS/gradivo/kiss.png' && povezave[i] != 'http://sandbox.lavbic.net/teaching/OIS/gradivo/sad.png'){
      $('#sporocila').append("<img src='" + povezave[i] + "'width=200px style='margin-left:20px'/>");
      
    }  
  }
}

function addVideo(vnos) {
  var link = vnos.match(new RegExp('\\bhttps:\/\/www.youtube.com\/watch\\?v=\\S*\\b', 'gi')); 
  for(var i in link) {
     $('#sporocila').append("<iframe src='https://www.youtube.com/embed/"+ link[i].substring(32, link[i].length) +"'allowfullscreen width=200px height=150px style='margin-left:20px'></iframe>");
     
  }
}



