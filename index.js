var instructions = "</br>Clicca su un cerchio per visualizzare informazioni su uno specifico Corso di Laurea di una Scuola.";
var legendData = [
    {
	property: "p_neutral",
	name: "Le Scuole e i Corsi di Laurea",
	index: 0,
	description: "In questa pagina puoi esplorare le diverse Scuole da cui è composta l'Università di Bologna, ognuna rappresentata da una icona diversa (la provetta ad esempio rappresenta la Scuola di Scienze, le cuffie la Scuola di Lingue e Letterature, Traduzione e Interpretazione).</br>I cerchi intorno alle icone sono i Corsi di ciascuna Scuola.</br><span style='color:red;'>",
	title: "Esplora le diverse Scuole dell'Università di Bologna"
    },{
	property: "p_lavorano",
	name: "Laureati che lavorano",
	index: 1,
	description: "Il grafico mostra la percentuale di laureati che lavorano per ciascun Corso di Laurea dell'Università di Bologna. I Corsi sono divisi in Scuole: ogni Scuola è rappresentata da una icona ed intorno ha l'insieme dei sui Corsi di Laurea rappresentati da un cerchio. Il raggio del cerchio è proporzionale alla percentuale di laureati che lavorano. Il dato si riferisce ai laureati nell’anno solare 2015 intervistati nel 2016 dopo un anno dal conseguimento del titolo ed è stato raccolto da AlmaLaurea.",
	title: "Percentuale di laureati che lavorano",
	property2: "p_lavorano_italia"
    },{
	property: "p_studiano",
	name: "Laureati che studiano",
	index: 2,
	description: "Il grafico mostra la percentuale di laureati che non lavorano ma studiano o non cercano lavoro. Il dato si riferisce ai laureati nell’anno solare 2015 intervistati nel 2016 dopo un anno dal conseguimento del titolo ed è stato raccolto da AlmaLaurea.",
	property2: "p_studiano_italia",
	title: "Percentuale di laureati che non lavorano ma studiano o non cercano lavoro"
    },{
	property: "p_fuoriregione",
	name: "Studenti fuori regione",
	index: 3,
	description: "Il grafico mostra la percentuale di studenti immatricolati nell'a.a. 2016/17 che proviene da regioni diverse dall'Emilia Romagna o che proviene dall'estero.",
	title: "Percentuale di studenti internazionali o che provengono da altre regioni"
    },{
	property: "p_laureatiincorso",
	name: "Laureati in corso",
	index: 4,
	description: "Il grafico mostra la percentuale di studenti immatricolati nell'a.a. 2013/14 (lauree triennali), 2014/15 (lauree magistrali), 2011/12 (lauree magistrali a ciclo unico di durata 5 anni), 2010/11 (lauree magistrali a ciclo unico di durata 6 anni). <span style='color:red;'>",
	title: "Percentuale di studenti laureati in corso"
    },{
	property: "p_esperienzaestero",
	name: "Esperienza all'estero",
	index: 5,
	description: "Il grafico mostra la percentuale di laureati che ha fatto un'esperienza all'estero. Il dato è riferito ai laureati nell’anno solare 2016, ed è stato raccolto da AlmaLaurea.<span style='color:red;'>",
	title: "Percentuale di laureati con esperienza all'estero"
    }];
//    { property: "p_soddisfatti", name: "Soddisfatti", index: 6},

var buttons = d3.select('#leftDiv')
    .selectAll('input')
    .data(legendData)
    .enter()
    .append('input')
    .attr('id', (d, i) => {return "button_" + i;})
    .attr('type', 'button')
    .attr('class', 'button')
    .attr('value', (b) => b.name);

var width = 1400,
    height = 1250,
    padding = 0, // separation between same-color circles
    clusterPadding = 30, // separation between different-color circles
    maxRadius = height*0.03;

var radiusScale = d3.scaleLinear()
    .domain([0,1])
    .range([0, maxRadius]);

var n = 227, // total number of nodes
    m = 11, // number of distinct clusters
    z = d3.scaleOrdinal(d3.schemeCategory20);

//load data
d3.csv("data/merged_mod.csv", data => {
    
    var grouped = groupBy(data, (e) => e.scuola_long);
    data = data.map((e) => {
	var i = 0;
	for (var [key, value] of grouped) {
	    if (key === e.scuola_long){
		e.scuola_long_code = i;
	    }
	    i = i+1;
	}
	return e;
    });

    d3.select('#header')
	.html(legendData[0].title);
    update(data, 'p_neutral');
    
    d3.select('#button_0')
	.style('background-color', '#00008B');
    d3.select('#leftDiv')
	.append('div')
	.attr('class', 'description')
	.html(legendData[0].description);
    d3.select('#leftDiv')
        .append('div')
        .attr('class', 'description instructions')
        .html(instructions);
    
    d3.selectAll('.button')
       .on('click',(b) => {

	   //update header
	   d3.select('#header')
	       .innerHtml = "";
	   d3.select('#header')
	       .html(b.title);
	   //update chart
	   d3.select('#svgChart')
               .remove();
	   update(data, b.property);
	   
	   //update buttons
	   d3.selectAll('.button')
               .style('background-color', '#B0B0B0');
           d3.select('#button_' + b.index)
               .style('background-color', '#00008B');
	   
	   //update description
	   d3.select('.description')
               .remove();
	   d3.select('.instructions')
	       .remove();
	   d3.select('#leftDiv')
	       .append('div')
	       .attr('class', 'description')
	       .html(b.description);	   
	   d3.select('#leftDiv')
	       .append('div')
	       .attr('class', 'description instructions')
	       .html(instructions);

	   d3.select('#svgLegend')
               .remove();
           if (b.index !== 0) drawLegend();
           
       });
});

function update(data, property) {
    var clusters = new Array(m);

    var svg = d3.select('#rightDiv')
	.append('div')
	.attr('id', 'svgChart')
	.append('svg')
	.attr('height', height)
	.attr('width', width)
	.append('g')
	.attr('transform', 'translate(' + width/2 + ',' + height/2 + ')');

    var nodes = data.map((e) => {
	// scale radius to fit on the screen
	
	e.p_neutral = (e.tipologia !== "Scuola")? 0.5 : 2;	
	var scaledRadius = radiusScale(+e[property]),
	    scaledRadius2 = e[property + "_italia"] ? radiusScale(+e[property + "_italia"]) : 0,
	    forcedCluster = +e.scuola_long_code;
	if (isNaN(scaledRadius)) scaledRadius = 0;
	// add cluster id and radius to array
	e.cluster = forcedCluster;
	e.r = scaledRadius,
	e.r2 = scaledRadius2,
	e.major = e.corso_descrizione;
	e.major_cat = e.scuola_long;
	// add to clusters array if it doesn't exist or the radius is larger than another radius in the cluster
	if (!clusters[forcedCluster] || (scaledRadius > clusters[forcedCluster].r)) clusters[forcedCluster] = e;
	
	return e;
    });
    
    var defs = svg.append('svg:defs');
    // append the circles to svg then style
    // add functions for interaction
    var nodeEnter = svg.append('g')
        .datum(nodes)
        .selectAll('.circle')
        .data(d => d)
        .enter()
    var circles = nodeEnter
	.append('circle')
        .attr('r', (d) => d.r)
        .attr('fill', (d) => z(d.cluster))
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .call(d3.drag()
	      .on('start', dragstarted)
	      .on('drag', dragged)
	      .on('end', dragended)
	     )
        // add tooltips to each circle
        .on('click', d => onCircleClick(d))
	//.on("mouseover", onCircleMouseover);
        
    svg.append('text')
	.html("Icone <a href='http://www.freepik.com' title='Freepik'>Freepik</a> <a href='https://www.flaticon.com/' title='Flaticon'>www.flaticon.com</a> licenza <a href='http://creativecommons.org/licenses/by/3.0/' title='Creative Commons BY 3.0' target='_blank'>CC 3.0 BY</a>")
        .attr('transform', 'translate(0,' + height/2 + ')');
/*
    d3.select('myPopup')
        .on('click', () => {
	    d3.select('myPopup').visibility = 'hidden !important';
	})
	
    d3.select('body')
	.on('click', () => {
	    console.log("click on body");
	    var popup = document.getElementById('myPopup');
	    popup.visibility = 'hidden !important';
	});
    svg.on('click', () => {
	console.log("click on svg");

        var popup = document.getElementById('myPopup');
        popup.visibility = 'hidden !important';
    });
    */
    var images = nodeEnter.filter((e,i) => i<11).append('image')
        .attr('id', (d,i) => 'image_'+i)
        .attr('xlink:href', (d) => d.internazionale)
        .attr('width', (d) => d.r*4/3)
        .attr('height', (d) => d.r*4/3)
        .attr('clip-path', 'url(#clipObj)')
	.on('click', onCircleClick);
    
    // create the clustering/collision force simulation
    var simulation = d3.forceSimulation(nodes)
	.velocityDecay(0.3)
	.force('x', d3.forceX().strength(.0005))
	.force('y', d3.forceY().strength(.0005))
	.force('collide', collide)
	.force('cluster', clustering)
	.on('tick', ticked);

    // These are implementations of the custom forces.        
    function clustering(alpha) {
	nodes.forEach(function(d) {
            var cluster = clusters[d.cluster];
            if (cluster === d) return;
            var x = d.x - cluster.x,
		y = d.y - cluster.y,
		l = Math.sqrt(x * x + y * y),
		r = d.r + cluster.r;
            if (l !== r) {
		l = (l - r) / l * alpha;
		d.x -= x *= l;
		d.y -= y *= l;
		cluster.x += x;
		cluster.y += y;
            }
	});
    };
    
    function collide(alpha) {
	var quadtree = d3.quadtree()
            .x((d) => d.x)
            .y((d) => d.y)
            .addAll(nodes);
	
	nodes.forEach(function(d) {
            var r = d.r + maxRadius + Math.max(padding, clusterPadding),
		nx1 = d.x - r,
		nx2 = d.x + r,
		ny1 = d.y - r,
		ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {	
		if (quad.data && (quad.data !== d)) {
                    var x = d.x - quad.data.x,
			y = d.y - quad.data.y,
			l = Math.sqrt(x * x + y * y),
			r = d.r + quad.data.r + (d.cluster === quad.data.cluster ? padding : clusterPadding);
                    if (l < r) {
			l = (l - r) / l * alpha;
			d.x -= x *= l;
			d.y -= y *= l;
			quad.data.x += x;
			quad.data.y += y;
                    }
		}
		return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
	});
    };

    function ticked() {
	circles
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y);
	
	images
            .attr('x', (d) => d.x-d.r*4/6)
            .attr('y', (d) => d.y-d.r*4/6);
    };

    // Drag functions used for interactivity
    function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(0.2).restart();
	d.fx = d.x;
	d.fy = d.y;
    };
    
    function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
    };
    
    function dragended(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
    };
};

function drawLegend() {
    var legend = d3.select('#legend')
	.append('svg')
	.attr('id', 'svgLegend')
        .attr('height', '150px')
        .attr('width', '460px')
        .selectAll('g')
	.data([0.25,0.50,0.75,1], (d) => d)
	.enter()
	.append('g');
    
    legend.append('circle')
	.attr('cy', 50)
	.attr('cx', (d, i) => i * 70 + radiusScale(d) * 2 + 30)
	.attr('r', (d) => radiusScale(d))
	.attr('fill', 'red')
        .attr('stroke', 'black')
	.attr('stroke-width', 1);
    legend.append('text')
	.attr('y', 130)
        .attr('x', (d, i) => i * 70 + radiusScale(d) * 2 + 12)
	.attr('font-size', '30px')
	.html((d) => (d * 100) + '%');
};

function onCircleClick(d) {
    var div = d3.select('body')
	.append('div')
	.attr('class', 'tooltip')
	.on('click', () => div.remove());
    console.log("click")
    div.transition()
	.duration(500)	
	.style("opacity", 0);
    div.transition()
	.duration(200)	
	.style("opacity", 1);
    div.html(printTooltip(d))
	.style("left", (d3.event.pageX - 700) + "px")			 
	.style("top", (d3.event.pageY - 28) + "px");
    
};

/*
function onCircleMouseover(d) {
    
    d3.select(this)
	.select('circle').transition()
	.duration(750)
	.attr('r', (d)=>{console.log(d);});
}
*/
function parse(a) {
    if (isNaN(a))
	return "-";
    
    return Math.round(a) + "%";
};

function printTooltip(d) {
    var text = "Scuola di " + d.major_cat;
    if (d.tipologia !== "Scuola") {
        text = text +
	    "<br/><b>" + d.major + "</b></br>" +
	    "Corso di " + d.tipologia + " (" + d.durata + " anni)</br>" +
	    "Corso" + (d.internazionale ? " " : " non ") + "internazionale in " + d.lingue + " con titolo" + (d.internazionale_titolo ? " " : " non ") + "internazionale</br></br>" +
	    "<a title='vai al sito' href=" + d.url + " target='_blank'>vai al sito</a></br></br>" +
            "Campus: " + d.campus + "</br>" +
            "Sede didattica: " + d.sededidattica + "</br>" +
            "Corso attivo: " + (d.immatricolabile ? "sì" : "no") + "</br>" +
	    "Accesso: " + d.accesso + "</br></br>" +
	    "<b>Percentuali riferite ai laureati nell’anno solare 2016</b></br>" +
	    "<table style='width:100%'>" +
	    "<tr><th>Bologna</th><th>Italia</th><th></th></tr>" + 
            "<tr><td><b>" + parse(100 * d.p_fuoriregione) + "</b></td><td>-</td><td>Studenti internazionali o provenienti da altre regioni</td></tr>" +
	    "<tr><td><b>" + parse(100 * d.p_esperienza_estero) + "</b></td><td>-</td><td>Laureati con esperienza all'estero</td></tr>" +
            "<tr><td><b>" + parse(100 * d.p_soddisfatti) + "</b></td><td>" + parse(100 * d.p_soddisfatti_italia) + "</td><td>Laureati soddisfatti dagli studi svolti</td></tr>" +
            "<tr><td><b>" + parse(100 * d.p_lavorano) + "(" + parse(100 * d.p_studiano) + ")</b></td><td>" + parse(100 * d.p_lavorano_italia) + "("  + parse(100 * d.p_studiano_italia) + ")</td><td>Laureati che lavorano (non lavorano) ma studiano o cercano</td></tr></table>";
    }
    return text;
};

function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
	}
    });
    return map;
}
