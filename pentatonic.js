// Pentatonic position-box logic, shared by index.html and the unit tests.
// UMD: works as a browser global (window.Pentatonic) and as a CommonJS module.
(function(root, factory){
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Pentatonic = api;
})(typeof self !== "undefined" ? self : this, function(){
  // Standard tuning, high e to low E (index 0 = high e, 5 = low E).
  var OPEN = [64, 59, 55, 50, 45, 40];
  var NF = 23;

  // The five movable pentatonic positions, per-string fret offsets relative
  // to the low-E anchor. Strings are ordered low-E .. high-e (index 0 = low E).
  var PENTPAT = {
    A: [[0,3],[0,2],[0,2],[0,2],[0,3],[0,3]],
    B: [[0,2],[-1,2],[-1,2],[-1,1],[0,2],[0,2]],
    C: [[0,2],[0,2],[0,2],[-1,2],[0,3],[0,2]],
    D: [[0,3],[0,3],[0,2],[0,2],[1,3],[0,3]],
    E: [[0,2],[0,2],[-1,2],[-1,2],[0,2],[0,2]]
  };

  // Scale-degree -> shape, in root-anchored order (root = Box 1).
  var PENTSEQ = {
    minor: [[0,"A"],[3,"B"],[5,"C"],[7,"D"],[10,"E"]],
    major: [[0,"B"],[2,"C"],[4,"D"],[7,"E"],[9,"A"]]
  };

  var SCALE = { major: [0,2,4,7,9], minor: [0,3,5,7,10] };

  function pentShapes(root, type){
    var R = ((root - OPEN[5]) % 12 + 12) % 12, out = [];
    PENTSEQ[type].forEach(function(d, i){
      var pat = PENTPAT[d[1]], base = (R + d[0]) % 12, notes = {}, minF = 99, maxF = -1;
      pat.forEach(function(offs, pi){
        var s = 5 - pi;
        offs.forEach(function(o){
          var f = base + o;
          if (f >= 0 && f <= NF){ notes[s + "|" + f] = true; minF = Math.min(minF, f); maxF = Math.max(maxF, f); }
        });
      });
      if (maxF < 0) return;
      out.push({ notes: notes, minF: minF, maxF: maxF, hasOpen: minF === 0, id: null, label: i + 1, shape: d[1], base: base });
    });
    return out;
  }

  return { OPEN: OPEN, NF: NF, PENTPAT: PENTPAT, PENTSEQ: PENTSEQ, SCALE: SCALE, pentShapes: pentShapes };
});
