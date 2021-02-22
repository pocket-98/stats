// calculate integral using trapazoid rule using finer partitions
function integral(f, a, b, params={}) {
    var EPS = 1.0e-8;
    var MAX_IT = 10;
    var VERBOSE = true;

    if (params.hasOwnProperty("EPS")) {
        EPS = params["EPS"];
    }

    if (params.hasOwnProperty("MAX_IT")) {
        MAX_IT = params["MAX_IT"];
    }

    if (params.hasOwnProperty("VERBOSE")) {
        VERBOSE = params["VERBOSE"];
    }

    // evaluate on end points
    var fa = f(a);
    var fb = f(b);
    var integ = fa + fb;
    integ = (b-a) * integ / 2;

    // build list of points to evaluate f on
    var next_x = function(n) {
        var pow = Math.ceil(Math.log2(1.5+n));
        var den = 2**pow;
        var num = 1 + 2*(1 + n - den/2);
        return [num,pow];
    }
    var index_of = function(num, pow) {
        return -1 + (num-1)/2 + 2**(pow-1);
    }

    // calculate new integral by adding midpoints 1/8, ... 7/8
    var n = 3;
    var X = [[1,1], [1,2], [3,2]]; // binary tree (1/2) (1/4,3/4) (1/8,...)
    var Y = [f(a+(b-a)*0.5), f(a+(b-a)*0.25), f(a+(b-a)*0.75)];
    var N = X.length;

    var old_integ = integ;
    var sum = Y.reduce((s, yj) => s + yj, 0.0);
    integ = fa + 2*sum + fb;
    integ = (b-a) * integ / (N+1) / 2;
    if (VERBOSE) {
        console.log("integ[0]: " + old_integ);
        console.log("integ[" + N + "]: " + integ);
    }

    // calculate new integral by adding 100 pts
    n = 124;
    var x = [...Array(n).keys()].map(xj => next_x(N+xj)); //[[1,2],[3,2],..]
    var y = x.map(xj => f(a + (b-a)*(xj[0]/2**xj[1])));

    x.forEach(xj => X.push(xj));
    y.forEach(yj => Y.push(yj));
    N += n;

    var calculate_integral = function(X, Y, N) {
        var j = 2**(next_x(N-1)[1]-1) - 1;
        var xj = X[j];
        var nextj = j;
        var num = xj[0];
        var pow = xj[1];
        var maxpow = pow;
        var sum = 0.0;

        // special case all points evenly spaced
        if (2**maxpow == N + 1) {
            sum = Y.reduce((s, yj) => s + yj, 0.0);
            integ = fa + 2*sum + fb;
            integ = (b-a) * integ / (N+1) / 2;
            return integ;
        }

        // accumulate left part of integral with small dx
        var k = 0;
        var old_j;
        while (0 <= j && j < N) {
            sum += Y[j];
            old_j = j;
            if (pow == maxpow) {
                num = Math.round((num+1) / 2);
                pow = maxpow - 1;
                while (0 == num % 2) {
                    num /= 2;
                    --pow;
                }
                j = index_of(num, pow);
            } else {
                num = 1 + num * 2**(maxpow-pow);
                pow = maxpow;
                j = index_of(num, maxpow);
            }
            ++k;
        }

        var integ = 0.0;
        if (j < 0) {
            integ = fa + 2*sum + fb;
            integ = (b-a) * integ / 2 / (N+1);
        } else {
            var x_mid = X[old_j];
            var f_mid = Y[old_j];
            integ = fa + 2*sum - f_mid;
            integ = (b-a)*x_mid[0]/2**x_mid[1] * integ / k / 2;
            sum = 0.0;

            // add 1/2**pow to x_j
            num = Math.round((num+1) / 2);
            pow = maxpow - 1;
            while (0 == num % 2) {
                num /= 2;
                --pow;
            }
            j = index_of(num, pow);

            --maxpow;

            // accumulate right half of integral
            while (0 <= j && j < N) {
                sum += Y[j];
                old_j = j;
                if (pow == maxpow) {
                    num = Math.round((num+1) / 2);
                    pow = maxpow - 1;
                    while (0 == num % 2) {
                        num /= 2;
                        --pow;
                    }
                    j = index_of(num, pow);
                } else {
                    num = 1 + num * 2**(maxpow-pow);
                    pow = maxpow;
                    j = index_of(num, maxpow);
                }
            }

            sum = f_mid + 2*sum + fb;
            integ += (b-a)*(1-x_mid[0]/2**x_mid[1]) * sum / (N-k+1) / 2;
        }

        return integ;
    }

    old_integ = integ;
    integ = calculate_integral(X, Y, N);
    if (VERBOSE) {
        console.log("integ[" + N + "]: " + integ);
    }

    // calculate integral for adding more points at a time until converg
    n = 128;
    var j = 1;
    var err = Math.abs(old_integ - integ);
    while (err > EPS && j <= MAX_IT) {
        x = [...Array(n).keys()].map(xj => next_x(N+xj));
        y = x.map(xj => f(a + (b-a)*(xj[0]/2**xj[1])));
        x.forEach(xj => X.push(xj));
        y.forEach(yj => Y.push(yj));
        N += n;
        old_integ = integ;
        integ = calculate_integral(X, Y, N);
        err = Math.abs(old_integ - integ);
        if (VERBOSE) {
            console.log(j + ": integ[" + N + "]: " + integ);
            console.log("         err: " + err);
        }
        n *= 2;
        j += 1;
    }

    return integ;
}


// calculate zero of curve using derivative and a guess
function newton_zero(f, df, x0, params={}) {
    var EPS = 1.0e-10;
    var MAX_IT = 10;
    var VERBOSE = true;

    if (params.hasOwnProperty("EPS")) {
        EPS = params["EPS"];
    }

    if (params.hasOwnProperty("MAX_IT")) {
        MAX_IT = params["MAX_IT"];
    }

    if (params.hasOwnProperty("VERBOSE")) {
        VERBOSE = params["VERBOSE"];
    }

    var j = 0;
    var cost = f(x0);
    var deriv = df(x0);
    var err = Math.abs(cost);
    var history = [[x0, cost, deriv]];

    if (VERBOSE) {
        console.log(j +": x0: " + x0);
        console.log("         err: " + cost);
    }

    while (err > EPS && j < MAX_IT) {
        ++j;
        x0 -= cost / deriv;
        cost = f(x0, j);
        deriv = df(x0);
        err = Math.abs(cost);
        history.push([x0, cost, deriv]);
        if (VERBOSE) {
            console.log(j +": x0: " + x0);
            console.log("         err: " + cost);
        }
    }

    x0 -= cost / deriv;
    if (VERBOSE) {
        console.log("converged to x=" + x0);
    }

    return x0;
}
