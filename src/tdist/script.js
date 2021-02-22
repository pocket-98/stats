function read_data() {
    doc.data = [];
    var xj = 0.0;
    $("#data").children().each(function() {
        xj = this.firstElementChild.valueAsNumber;
        if (isFinite(xj) && !isNaN(xj)) {
            doc.data.push(xj);
        }
    });

    doc.confidence = parseFloat($("#conf").val());

    console.log("data: ", doc.data);
    console.log("confidence: ", doc.confidence);
    calculate_stats();
}

function remove_listener(xj) {

}

function add_data_listeners() {
    $("#data").children().each(function() {
        $(this).on("change keyup", function() {
            var j = parseInt(this.firstElementChild.id.substring(1));
            doc.data[j] = this.firstElementChild.valueAsNumber;
            if (isNaN(doc.data[j]) || !isFinite(doc.data[j])) {
                read_data();
            } else {
                console.log("updated x" + j + " to " + doc.data[j]);
                calculate_stats();
            }
        });
    });

    var append = function() {
        console.log("aa");
        //TODO add more data while being entered
        //TODO add download data button
        //TODO add upload data button
    };

    $("#data").children().last().on("change keydown", append);

    $("#conf").on("change keyup", function() {
        doc.confidence = this.valueAsNumber;
        console.log("updated confidence to " + doc.confidence);
        calculate_tvalue();
        calculate_interval();
    });
}

function calculate_stats() {
    doc.n = doc.data.length;
    doc.xbar = doc.data.reduce((s,xj) => s+xj, 0) / doc.n;
    if (doc.n > 1) {
        doc.s2 = doc.data.reduce((s2,xj) => s2+(xj-doc.xbar)**2, 0) / (doc.n-1);
    } else {
        doc.s2 = Infinity;
    }

    $("#n").html(doc.n);
    $("#xbar").html(doc.xbar);
    $("#s2").html(doc.s2);
    $("#nu").html(doc.n - 1);

    calculate_tvalue();
    calculate_interval();
}

function calculate_tvalue() {
    var alpha = (1-doc.confidence) / 2;
    var nu = doc.n - 1;

    $("#conf2").html(doc.confidence);

    var f = function(t) {
        return 1/Math.sqrt(Math.PI*nu)*math.gamma((nu+1)/2)/math.gamma(nu/2)*(1+t**2/nu)**(-(nu+1)/2);
    }

    var cost = function(t, j=5) {
        var i = integral(f, -t, t, {VERBOSE: false, MAX_IT:5+j});
        return (i - doc.confidence);
    }

    var cost_deriv = function(t) {
        return 2 * f(t);
    }

    var guess = 2.0;

    if (nu < 1) {
        doc.t0 = Infinity;
    } else {
        doc.t0 = newton_zero(cost, cost_deriv, guess);
    }
    $("#t0").html(doc.t0);

    calculate_interval();
}

function calculate_interval() {
    var sigma_t0 = Math.sqrt(doc.s2/doc.n) * doc.t0;
    $("#a").html(doc.xbar - sigma_t0);
    $("#b").html(doc.xbar + sigma_t0);
}

$(document).ready(function() {
    read_data();
    add_data_listeners();
});
