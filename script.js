// RSA demo: implementación en JavaScript usando BigInt
// Utilidades: MCD, inverso modular (Euclides extendido), exponenciación modular rápida

// Máximo común divisor (BigInt, algoritmo de Euclides)
function mcd(a, b) {
  a = BigInt(a); b = BigInt(b);
  while (b !== 0n) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Extended Euclidean to compute modular inverse (returns BigInt or null if none)
function egcd(a, b) {
  a = BigInt(a); b = BigInt(b);
  if (b === 0n) return { g: a, x: 1n, y: 0n };
  let x0 = 1n, y0 = 0n;
  let x1 = 0n, y1 = 1n;
  while (b !== 0n) {
    const q = a / b;
    const r = a % b;
    const x2 = x0 - q * x1;
    const y2 = y0 - q * y1;
    a = b; b = r;
    x0 = x1; x1 = x2;
    y0 = y1; y1 = y2;
  }
  return { g: a, x: x0, y: y0 };
}

function inversoModular(e, phi) {
  e = BigInt(e); phi = BigInt(phi);
  const res = egcd(e, phi);
  if (res.g !== 1n) return null; // no inverse
  let inv = res.x % phi;
  if (inv < 0n) inv += phi;
  return inv;
}

// Exponenciación modular rápida (para BigInt)
function modExp(base, exp, mod) {
  base = BigInt(base);
  exp = BigInt(exp);
  mod = BigInt(mod);
  let resultado = 1n;
  base = base % mod;
  while (exp > 0n) {
    if ((exp & 1n) === 1n) resultado = (resultado * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return resultado;
}

// Parámetros demo (primos pequeños)
let p = 61n;
let q = 53n;
let n = p * q; // 3233
let phi = (p - 1n) * (q - 1n); // 3120
let e = 17n; // público
let d = inversoModular(e, phi); // privado (BigInt)

console.log('Clave publica del receptor(n,e):', n.toString(), e.toString());
console.log('Clave privada del receptor(n,d):', n.toString(), (d === null ? 'null' : d.toString()));

// Cifrado: toma texto del input #mensaje, cifra cada carácter por separado y muestra en #cifrado
function cifrar() {
  const mensajeInput = document.getElementById('mensaje');
  if (!mensajeInput) { alert('No se encontró el input #mensaje en la página'); return; }
  const mensaje = mensajeInput.value;
  if (!mensaje) { alert('Por favor, escribe un mensaje para cifrar'); return; }

  // cifrar cada caracter por separado (demostración)
  const cifradoArray = [];
  for (let i = 0; i < mensaje.length; i++) {
    const ch = mensaje[i];
    let code;
    if (ch === ' ') {
      code = 0n;
    } else if (/[a-zA-Z]/.test(ch)) {
      // mapear letras a/A..z/Z -> 1..26
      const lower = ch.toLowerCase();
      code = BigInt(lower.charCodeAt(0) - 96); // 'a' -> 1
    } else {
      // otros caracteres: mapear a un rango distinto para preservar información
      code = BigInt(ch.charCodeAt(0) + 26);
    }
    const c = modExp(code, e, n);
    cifradoArray.push(c.toString());
  }

  const outEl = document.getElementById('cifrado');
  const descEl = document.getElementById('descifrado');
  if (outEl) outEl.textContent = cifradoArray.join(' ');
  if (descEl) descEl.textContent = '';
  alert('✅ Mensaje cifrado con la clave pública del receptor');
}

// Descifrado: lee texto de #cifrado, asume secuencia de números separados por espacio
function descifrar() {
  const outEl = document.getElementById('cifrado');
  const descEl = document.getElementById('descifrado');
  if (!outEl) { alert('No se encontró el elemento #cifrado'); return; }
  const cifradoTexto = outEl.textContent.trim();
  if (!cifradoTexto) { alert('Primero cifra un mensaje antes de descifrar'); return; }

  const cifradoArray = cifradoTexto.split(/\s+/);
  let descifrado = '';
  for (let i = 0; i < cifradoArray.length; i++) {
    const token = cifradoArray[i];
    if (!token) continue;
    const c = BigInt(token);
    const m = modExp(c, d, n);
    const mNum = Number(m);
    if (mNum === 0) {
      descifrado += ' ';
    } else if (mNum >= 1 && mNum <= 26) {
      // 1 -> 'a', 2 -> 'b', ...
      descifrado += String.fromCharCode(96 + mNum);
    } else {
      // otros: recuperar ascii original (restar 26)
      descifrado += String.fromCharCode(mNum - 26);
    }
  }

  if (descEl) descEl.textContent = descifrado;
  alert('🔓 Mensaje descifrado con la clave privada del receptor');
}

// Ataque de demostración: un "hacker" cifra con su propia clave y el receptor trata de verificarlo.
function ataqueHacker() {
  const mensajeHacker = 'Mensaje falsificado por el hacker';
  const nHacker = 187n; // ejemplo
  const eHacker = 7n;
  const dHacker = 23n;

  const cifradoFalso = [];
  for (let i = 0; i < mensajeHacker.length; i++) {
    const m = BigInt(mensajeHacker.charCodeAt(i));
    const c = modExp(m, eHacker, nHacker);
    cifradoFalso.push(c.toString());
  }

  // Receptor intenta verificarlo con la clave del emisor original (esto fallará en la comprobación)
  let verificado = true;
  for (let i = 0; i < cifradoFalso.length; i++) {
    const c = BigInt(cifradoFalso[i]);
    const mVerif = modExp(c, d, n); // intentar descifrar con la privada del emisor
    if (mVerif > 255n || mVerif < 32n) verificado = false;
  }

  const outEl = document.getElementById('cifrado');
  const descEl = document.getElementById('descifrado');
  if (outEl) outEl.textContent = cifradoFalso.join(' ');
  if (descEl) descEl.textContent = '❌ Firma digital no válida. Mensaje rechazado';
  if (!verificado) {
    alert('⚠️ Intento de suplantación detectado: la firma no coincide con la del emisor original.');
  }
}

// Exportar funciones al scope global para que los botones onclick las encuentren
window.cifrar = cifrar;
window.descifrar = descifrar;
window.ataqueHacker = ataqueHacker;

console.log('φ(n):', phi.toString());
if (d !== null) console.log('Verificacion de (e*d) mod φ(n):', ((e * d) % phi).toString());
