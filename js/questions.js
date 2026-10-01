/* ===== Question Generators — ป.3–ป.4 Math ===== */
(function (global) {
  "use strict";

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[rand(0, arr.length - 1)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }

  function simplify(n, d) {
    const g = gcd(n, d);
    return [n / g, d / g];
  }

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  function round2(x) {
    return Math.round(x * 100) / 100;
  }

  function fmtDec(x) {
    if (Number.isInteger(x)) return String(x);
    return String(parseFloat(x.toFixed(2)));
  }

  /* Difficulty ranges based on grade + difficulty */
  function ranges(grade, diff) {
    // grade: 'p3' | 'p4', diff: 'easy' | 'medium' | 'hard'
    const cfg = {
      p3: {
        easy:   { mulMax: 5,  mulA: [1,5],  mulB: [1,5],  divMax: 25,  rem: false, fracD: [2,4],  decPlaces: 1, decMax: 10 },
        medium: { mulMax: 9,  mulA: [2,9],  mulB: [2,9],  divMax: 81,  rem: false, fracD: [2,8],  decPlaces: 1, decMax: 50 },
        hard:   { mulMax: 10, mulA: [3,12], mulB: [2,10], divMax: 100, rem: true,  fracD: [3,10], decPlaces: 2, decMax: 100 },
      },
      p4: {
        easy:   { mulMax: 9,  mulA: [2,9],  mulB: [2,9],  divMax: 81,  rem: false, fracD: [2,8],  decPlaces: 1, decMax: 50 },
        medium: { mulMax: 12, mulA: [3,12], mulB: [2,12], divMax: 144, rem: true,  fracD: [3,12], decPlaces: 2, decMax: 100 },
        hard:   { mulMax: 15, mulA: [4,15], mulB: [3,12], divMax: 200, rem: true,  fracD: [4,16], decPlaces: 2, decMax: 200 },
      },
    };
    return cfg[grade][diff];
  }

  /* ---------- MULTIPLICATION ---------- */
  function genMultiply(grade, diff) {
    const r = ranges(grade, diff);
    const type = pick(["facts", "facts", "facts", "missing", "long"]);

    if (type === "missing" && diff !== "easy") {
      const a = rand(r.mulA[0], r.mulA[1]);
      const b = rand(r.mulB[0], r.mulB[1]);
      const prod = a * b;
      const hideA = Math.random() < 0.5;
      if (hideA) {
        return {
          type: "mul", subtype: "missing",
          prompt: "หาจำนวนที่หายไป",
          expression: `□ × ${b} = ${prod}`,
          answer: a,
          choices: makeChoices(a, [1, r.mulA[1] + 2]),
          explain: `เพราะ ${a} × ${b} = ${prod} ดังนั้นช่องว่างคือ ${a}`,
        };
      }
      return {
        type: "mul", subtype: "missing",
        prompt: "หาจำนวนที่หายไป",
        expression: `${a} × □ = ${prod}`,
        answer: b,
        choices: makeChoices(b, [1, r.mulB[1] + 2]),
        explain: `เพราะ ${a} × ${b} = ${prod} ดังนั้นช่องว่างคือ ${b}`,
      };
    }

    if (type === "long" && (diff === "hard" || (diff === "medium" && grade === "p4"))) {
      const a = rand(11, grade === "p4" ? 99 : 49);
      const b = rand(2, diff === "hard" ? 12 : 9);
      const prod = a * b;
      return {
        type: "mul", subtype: "long",
        prompt: "คูณเลขยาว — พิมพ์คำตอบ",
        expression: `${a} × ${b} = ?`,
        longOp: true,
        answer: prod,
        input: true,
        explain: `${a} × ${b} = ${prod}`,
      };
    }

    // facts
    const a = rand(r.mulA[0], r.mulA[1]);
    const b = rand(r.mulB[0], r.mulB[1]);
    const prod = a * b;
    const useInput = diff === "hard" && Math.random() < 0.4;
    return {
      type: "mul", subtype: "facts",
      prompt: "คูณเร็ว! เท่ากับเท่าไร?",
      expression: `${a} × ${b} = ?`,
      answer: prod,
      choices: useInput ? null : makeChoices(prod, [0, prod + 20]),
      input: useInput,
      explain: `${a} × ${b} = ${prod}`,
    };
  }

  /* ---------- DIVISION ---------- */
  function genDivision(grade, diff) {
    const r = ranges(grade, diff);
    const withRem = r.rem && Math.random() < (diff === "hard" ? 0.55 : 0.35);

    if (withRem) {
      const divisor = rand(2, grade === "p4" ? 12 : 9);
      const quotient = rand(2, Math.min(12, Math.floor(r.divMax / divisor)));
      let rem = rand(1, divisor - 1);
      const dividend = divisor * quotient + rem;
      const ansStr = `${quotient} เศษ ${rem}`;
      return {
        type: "div", subtype: "remainder",
        prompt: "หารแล้วมีเศษ — เลือกคำตอบที่ถูก",
        expression: `${dividend} ÷ ${divisor} = ?`,
        answer: ansStr,
        answerAlt: [quotient, rem],
        choices: makeRemChoices(quotient, rem, divisor),
        explain: `${dividend} ÷ ${divisor} = ${quotient} เศษ ${rem} เพราะ ${divisor}×${quotient}=${divisor*quotient} แล้วเหลือ ${rem}`,
      };
    }

    // exact division
    const divisor = rand(2, grade === "p4" ? (diff === "hard" ? 12 : 10) : 9);
    const quotient = rand(2, Math.min(15, Math.floor(r.divMax / divisor)));
    const dividend = divisor * quotient;

    if (diff !== "easy" && Math.random() < 0.3) {
      // missing factor style: □ ÷ d = q
      return {
        type: "div", subtype: "missing",
        prompt: "หาจำนวนที่หายไป",
        expression: `□ ÷ ${divisor} = ${quotient}`,
        answer: dividend,
        choices: makeChoices(dividend, [divisor, dividend + divisor * 3]),
        explain: `เพราะ ${dividend} ÷ ${divisor} = ${quotient}`,
      };
    }

    const useInput = diff === "hard" && Math.random() < 0.35;
    return {
      type: "div", subtype: "exact",
      prompt: "หารแม่น! ได้เท่าไร?",
      expression: `${dividend} ÷ ${divisor} = ?`,
      answer: quotient,
      choices: useInput ? null : makeChoices(quotient, [1, quotient + 8]),
      input: useInput,
      explain: `${dividend} ÷ ${divisor} = ${quotient} เพราะ ${divisor} × ${quotient} = ${dividend}`,
    };
  }

  function makeRemChoices(q, rem, divisor) {
    const opts = new Set([`${q} เศษ ${rem}`]);
    let guard = 0;
    while (opts.size < 4 && guard++ < 50) {
      const qq = Math.max(1, q + rand(-3, 3));
      let rr = divisor <= 1 ? 1 : rand(1, divisor - 1);
      if (qq === q && rr === rem) continue;
      opts.add(`${qq} เศษ ${rr}`);
    }
    let i = 1;
    while (opts.size < 4) {
      opts.add(`${q + i} เศษ ${Math.max(1, rem)}`);
      i++;
    }
    return shuffle([...opts]);
  }

  /* ---------- FRACTIONS ---------- */
  function genFraction(grade, diff) {
    const r = ranges(grade, diff);
    const kinds = ["identify", "identify", "compare", "compare"];
    if (diff !== "easy") kinds.push("add", "add");
    if (diff === "hard" || grade === "p4") kinds.push("equivalent", "subtract");
    const kind = pick(kinds);

    if (kind === "identify") {
      const den = pick(r.fracD.length ? rangeList(r.fracD[0], r.fracD[1]).filter(d => d >= 2) : [2,3,4,5,6,8]);
      const num = rand(1, Math.max(1, den - 1));
      const [sn, sd] = simplify(num, den);
      return {
        type: "frac", subtype: "identify",
        prompt: "เศษส่วนนี้คือเท่าไร? (ดูแถบสี)",
        expression: "?",
        visual: { kind: "bar", num, den },
        answer: `${num}/${den}`,
        answerNorm: [num, den],
        choices: makeFracChoices(num, den),
        explain: `แถบแบ่งเป็น ${den} ส่วน ระบาย ${num} ส่วน จึงเป็น ${num}/${den}`,
        acceptSimplified: true,
        simplified: `${sn}/${sd}`,
      };
    }

    if (kind === "compare") {
      let d1 = rand(r.fracD[0], r.fracD[1]);
      let d2 = Math.random() < 0.5 ? d1 : rand(r.fracD[0], r.fracD[1]);
      if (d1 < 2) d1 = 2; if (d2 < 2) d2 = 2;
      let n1 = rand(1, d1 - 1);
      let n2 = rand(1, d2 - 1);
      // avoid equal by chance sometimes allow equal
      const v1 = n1 / d1, v2 = n2 / d2;
      let correct;
      if (Math.abs(v1 - v2) < 1e-9) correct = "=";
      else correct = v1 > v2 ? ">" : "<";
      return {
        type: "frac", subtype: "compare",
        prompt: "เปรียบเทียบเศษส่วน เลือกเครื่องหมายที่ถูก",
        expression: `${n1}/${d1}  □  ${n2}/${d2}`,
        visual: { kind: "bars", pairs: [[n1,d1],[n2,d2]] },
        answer: correct,
        choices: ["<", "=", ">"],
        choicesLayout: "row",
        explain: `${n1}/${d1} ${fmtVal(v1)} และ ${n2}/${d2} ${fmtVal(v2)} ดังนั้น ${n1}/${d1} ${correct} ${n2}/${d2}`,
      };
    }

    if (kind === "equivalent") {
      const den = rand(2, 6);
      const num = rand(1, den - 1);
      const k = rand(2, diff === "hard" ? 4 : 3);
      const [sn, sd] = [num, den];
      return {
        type: "frac", subtype: "equivalent",
        prompt: "เศษส่วนที่เท่ากันคือข้อใด?",
        expression: `${sn}/${sd} = ?`,
        visual: { kind: "bar", num: sn, den: sd },
        answer: `${sn * k}/${sd * k}`,
        choices: shuffle([
          `${sn * k}/${sd * k}`,
          `${sn + k}/${sd + k}`,
          `${sn * k}/${sd}`,
          `${sn}/${sd * k}`,
        ]),
        explain: `คูณเศษและส่วนด้วย ${k}: ${sn}×${k}=${sn*k}, ${sd}×${k}=${sd*k} ได้ ${sn*k}/${sd*k}`,
      };
    }

    if (kind === "subtract") {
      const denPool = [2,3,4,5,6,8,10].filter(d => d >= r.fracD[0] && d <= r.fracD[1] + 2);
      const den = pick(denPool.length ? denPool : [4,5,6,8]);
      const n1 = rand(2, den);
      const n2 = rand(1, n1 - 1);
      const ansN = n1 - n2;
      return {
        type: "frac", subtype: "subtract",
        prompt: "ลบเศษส่วน (ส่วนเท่ากัน)",
        expression: `${n1}/${den} − ${n2}/${den} = ?`,
        visual: { kind: "bar", num: n1, den },
        answer: `${ansN}/${den}`,
        choices: makeFracChoices(ansN, den),
        explain: `ส่วนเท่ากัน ลบแค่เศษ: ${n1}−${n2}=${ansN} ได้ ${ansN}/${den}`,
        acceptSimplified: true,
        simplified: simplify(ansN, den).join("/"),
      };
    }

    // add same denominator
    const addPool = [2,3,4,5,6,8,10].filter(d => d >= r.fracD[0] && d <= Math.max(r.fracD[1], 6));
    const den = pick(addPool.length ? addPool : [4,5,6,8]);
    const n1 = rand(1, Math.max(1, Math.floor(den / 2)));
    const n2 = rand(1, Math.max(1, den - n1));
    const ansN = n1 + n2;
    // maybe improper for hard
    return {
      type: "frac", subtype: "add",
      prompt: "บวกเศษส่วน (ส่วนเท่ากัน)",
      expression: `${n1}/${den} + ${n2}/${den} = ?`,
      visual: { kind: "bars", pairs: [[n1,den],[n2,den]] },
      answer: `${ansN}/${den}`,
      choices: makeFracChoices(ansN, den),
      explain: `ส่วนเท่ากัน บวกแค่เศษ: ${n1}+${n2}=${ansN} ได้ ${ansN}/${den}`,
      acceptSimplified: true,
      simplified: simplify(ansN, den).join("/"),
    };
  }

  function fmtVal(v) {
    return `(≈${v.toFixed(2)})`;
  }

  function rangeList(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  function makeFracChoices(num, den) {
    const correct = `${num}/${den}`;
    const opts = new Set([correct]);
    const candidates = [
      `${Math.max(1, num - 1)}/${den}`,
      `${num + 1}/${den}`,
      `${num}/${Math.max(2, den - 1)}`,
      `${num}/${den + 1}`,
      `${num + 1}/${den + 1}`,
      `${Math.max(1, den - num)}/${den}`,
      `${num}/${den + 2}`,
      `1/${den}`,
      `${den - 1}/${den}`,
      `${num * 2}/${den * 2}`,
    ];
    for (const c of shuffle(candidates)) {
      if (opts.size >= 4) break;
      if (c !== correct && !c.startsWith("0/") && !c.includes("/0") && !c.endsWith("/0")) opts.add(c);
    }
    let guard = 0;
    while (opts.size < 4 && guard++ < 40) {
      const n = rand(1, Math.max(den + 2, 4));
      const d = rand(2, Math.max(den + 2, 6));
      const c = `${n}/${d}`;
      if (c !== correct) opts.add(c);
    }
    // last resort filler
    let i = 1;
    while (opts.size < 4) {
      opts.add(`${i}/${den + 3}`);
      i++;
    }
    return shuffle([...opts]);
  }

  /* ---------- DECIMALS ---------- */
  function genDecimal(grade, diff) {
    const r = ranges(grade, diff);
    const kinds = ["place", "place", "compare", "compare"];
    if (diff !== "easy") kinds.push("add", "sub");
    if (diff === "hard" || grade === "p4") kinds.push("fromfrac", "round");
    const kind = pick(kinds);

    if (kind === "place") {
      const places = r.decPlaces;
      let num;
      if (places === 1) {
        num = round1(rand(1, r.decMax * 10) / 10);
      } else {
        num = round2(rand(1, r.decMax * 100) / 100);
      }
      const s = fmtDec(num);
      const parts = s.split(".");
      const whole = parts[0];
      const frac = parts[1] || "";
      let askPlace, correctDigit, placeName;
      if (frac.length >= 1 && Math.random() < 0.7) {
        if (frac.length >= 2 && places >= 2 && Math.random() < 0.5) {
          askPlace = "hundredths";
          correctDigit = frac[1];
          placeName = "หลักส่วนร้อย (ทศนิยมตำแหน่งที่ 2)";
        } else {
          askPlace = "tenths";
          correctDigit = frac[0];
          placeName = "หลักส่วนสิบ (ทศนิยมตำแหน่งที่ 1)";
        }
      } else {
        askPlace = "ones";
        correctDigit = whole[whole.length - 1];
        placeName = "หลักหน่วย";
      }
      return {
        type: "dec", subtype: "place",
        prompt: `เลข ${s} — ตัวเลขใน${placeName}คืออะไร?`,
        expression: s,
        answer: correctDigit,
        choices: shuffle([...new Set([correctDigit, ...Array.from({length: 5}, () => String(rand(0,9)))])].slice(0, 4)),
        explain: `ในเลข ${s} ${placeName}คือ ${correctDigit}`,
      };
    }

    if (kind === "compare") {
      let a, b;
      if (r.decPlaces === 1) {
        a = round1(rand(0, r.decMax * 10) / 10);
        b = round1(rand(0, r.decMax * 10) / 10);
      } else {
        a = round2(rand(0, r.decMax * 100) / 100);
        b = round2(rand(0, r.decMax * 100) / 100);
      }
      // sometimes make close
      if (Math.random() < 0.3) b = round2(a + pick([-0.1, 0.1, -0.01, 0.01, 0]));
      let correct;
      if (a === b) correct = "=";
      else correct = a > b ? ">" : "<";
      return {
        type: "dec", subtype: "compare",
        prompt: "เปรียบเทียบทศนิยม",
        expression: `${fmtDec(a)}  □  ${fmtDec(b)}`,
        compare: [fmtDec(a), fmtDec(b)],
        answer: correct,
        choices: ["<", "=", ">"],
        choicesLayout: "row",
        explain: `${fmtDec(a)} ${correct} ${fmtDec(b)}`,
      };
    }

    if (kind === "fromfrac") {
      const dens = [2, 4, 5, 10];
      const den = pick(dens);
      const num = rand(1, den);
      const val = num / den;
      const ans = fmtDec(round2(val));
      return {
        type: "dec", subtype: "fromfrac",
        prompt: "เขียนเศษส่วนเป็นทศนิยม",
        expression: `${num}/${den} = ?`,
        visual: { kind: "bar", num, den },
        answer: ans,
        choices: makeDecChoices(parseFloat(ans)),
        explain: `${num}÷${den} = ${ans}`,
      };
    }

    if (kind === "round") {
      const num = round2(rand(10, r.decMax * 100) / 100);
      const rounded = round1(num);
      return {
        type: "dec", subtype: "round",
        prompt: "ปัดทศนิยมให้เหลือ 1 ตำแหน่ง",
        expression: `${fmtDec(num)} ≈ ?`,
        answer: fmtDec(rounded),
        choices: makeDecChoices(rounded),
        explain: `ปัด ${fmtDec(num)} เป็นทศนิยม 1 ตำแหน่ง ได้ ${fmtDec(rounded)}`,
      };
    }

    // add / sub
    let a, b;
    if (r.decPlaces === 1) {
      a = round1(rand(1, Math.floor(r.decMax * 0.6) * 10) / 10);
      b = round1(rand(1, Math.floor(r.decMax * 0.4) * 10) / 10);
    } else {
      a = round2(rand(1, Math.floor(r.decMax * 0.6) * 100) / 100);
      b = round2(rand(1, Math.floor(r.decMax * 0.4) * 100) / 100);
    }

    if (kind === "sub" || (kind === "add" && Math.random() < 0.4 && a > b)) {
      if (a < b) [a, b] = [b, a];
      const ans = round2(a - b);
      return {
        type: "dec", subtype: "sub",
        prompt: "ลบทศนิยม",
        expression: `${fmtDec(a)} − ${fmtDec(b)} = ?`,
        answer: fmtDec(ans),
        choices: diff === "hard" ? null : makeDecChoices(ans),
        input: diff === "hard",
        explain: `${fmtDec(a)} − ${fmtDec(b)} = ${fmtDec(ans)}`,
      };
    }

    const ans = round2(a + b);
    return {
      type: "dec", subtype: "add",
      prompt: "บวกทศนิยม",
      expression: `${fmtDec(a)} + ${fmtDec(b)} = ?`,
      answer: fmtDec(ans),
      choices: diff === "hard" ? null : makeDecChoices(ans),
      input: diff === "hard",
      explain: `${fmtDec(a)} + ${fmtDec(b)} = ${fmtDec(ans)}`,
    };
  }

  function makeDecChoices(ans) {
    const opts = new Set([fmtDec(ans)]);
    const deltas = [0.1, -0.1, 0.01, -0.01, 1, -1, 0.2, -0.2, 0.5, 0.3, -0.3, 2];
    for (const d of shuffle(deltas)) {
      if (opts.size >= 4) break;
      const v = round2(ans + d);
      if (v >= 0) opts.add(fmtDec(v));
    }
    let guard = 0;
    while (opts.size < 4 && guard++ < 40) {
      opts.add(fmtDec(round2(Math.max(0, ans + rand(-20, 20) / 10))));
    }
    let i = 1;
    while (opts.size < 4) {
      opts.add(fmtDec(round2(ans + i + 0.1)));
      i++;
    }
    return shuffle([...opts]);
  }

  function makeChoices(correct, [lo, hi]) {
    const opts = new Set([correct]);
    [-1, 1, 2, -2, 3, -3, 5, 10, -5].forEach(d => {
      const v = correct + d;
      if (opts.size < 4 && v >= 0 && v !== correct) opts.add(v);
    });
    let guard = 0;
    const low = Math.max(0, Math.min(lo, correct - 5));
    const high = Math.max(hi, correct + 8, low + 4);
    while (opts.size < 4 && guard++ < 60) {
      const v = rand(low, high);
      if (v !== correct) opts.add(v);
    }
    let i = 1;
    while (opts.size < 4) {
      opts.add(correct + 20 + i);
      i++;
    }
    return shuffle([...opts]);
  }

  /* ---------- MIX ---------- */
  function genMix(grade, diff) {
    const gens = [genMultiply, genDivision, genFraction, genDecimal];
    return pick(gens)(grade, diff);
  }

  const GENERATORS = {
    mul: genMultiply,
    div: genDivision,
    frac: genFraction,
    dec: genDecimal,
    mix: genMix,
  };

  function generate(mode, grade, diff) {
    const gen = GENERATORS[mode] || genMix;
    let q;
    let tries = 0;
    do {
      q = gen(grade, diff);
      tries++;
    } while (!q && tries < 5);
    q.id = Date.now() + "-" + rand(1000, 9999);
    q.mode = mode;
    return q;
  }

  function checkAnswer(q, userAnswer) {
    if (userAnswer === null || userAnswer === undefined || userAnswer === "") return false;
    const ua = String(userAnswer).trim().replace(/\s+/g, " ");

    if (q.subtype === "remainder") {
      // accept "q เศษ r" or "q r" or array
      if (ua === String(q.answer)) return true;
      const m = ua.match(/^(\d+)\s*(?:เศษ|,|\/)?\s*(\d+)$/);
      if (m && q.answerAlt) {
        return parseInt(m[1], 10) === q.answerAlt[0] && parseInt(m[2], 10) === q.answerAlt[1];
      }
      return false;
    }

    if (q.type === "frac" && (ua.includes("/") || q.acceptSimplified)) {
      const norm = ua.replace(/\s/g, "");
      if (norm === String(q.answer).replace(/\s/g, "")) return true;
      if (q.simplified && norm === q.simplified) return true;
      if (q.answerNorm) {
        const m = norm.match(/^(\d+)\/(\d+)$/);
        if (m) {
          const [n, d] = [parseInt(m[1],10), parseInt(m[2],10)];
          if (d === 0) return false;
          const [sn, sd] = simplify(n, d);
          const [cn, cd] = simplify(q.answerNorm[0], q.answerNorm[1]);
          return sn === cn && sd === cd;
        }
      }
      return false;
    }

    if (q.type === "dec") {
      const n1 = parseFloat(ua.replace(",", "."));
      const n2 = parseFloat(String(q.answer).replace(",", "."));
      if (!isNaN(n1) && !isNaN(n2)) return Math.abs(n1 - n2) < 0.001;
    }

    // numeric
    const nUser = parseFloat(ua.replace(",", "."));
    const nAns = parseFloat(String(q.answer));
    if (!isNaN(nUser) && !isNaN(nAns) && String(q.answer).match(/^-?\d+(\.\d+)?$/)) {
      return Math.abs(nUser - nAns) < 0.001;
    }

    return ua === String(q.answer);
  }

  global.MathQuestions = {
    generate,
    checkAnswer,
    ranges,
  };
})(typeof window !== "undefined" ? window : globalThis);
