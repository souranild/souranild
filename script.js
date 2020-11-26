
anime({
    targets: 'h1',
    scale: 2,
    translateX: 80
});



Url="http://ip-api.com/json/#";

$.getJSON(Url , function(data) { 
            $("#ipinfo").html(`And you're ${data.query} from ${data.city}, ${data.country}`);
        }) 