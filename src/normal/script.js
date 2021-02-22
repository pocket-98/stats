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
    calculate_zvalue();
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
        calculate_zvalue();
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

    calculate_interval();
}

function calculate_zvalue() {
    var alpha = (1-doc.confidence) / 2;
    $("#conf2").html(doc.confidence);

    var f = function(z) {
        return 1/Math.sqrt(2*Math.PI)*Math.exp(-(z**2)/2);
    }

    var cost = function(z, j=5) {
        var i = integral(f, -z, z, {VERBOSE: false, MAX_IT:5+j});
        return (i - doc.confidence);
    }

    var cost_deriv = function(z) {
        return 2 * f(z);
    }

    var guess = 2.0;

    doc.z0 = newton_zero(cost, cost_deriv, guess);

    $("#z0").html(doc.z0);

    calculate_interval();
}

function calculate_interval() {
    var sigma_z0 = Math.sqrt(doc.s2/doc.n) * doc.z0;
    $("#a").html(doc.xbar - sigma_z0);
    $("#b").html(doc.xbar + sigma_z0);
}

$(document).ready(function() {
    read_data();
    add_data_listeners();
});
