

"use strict";

/* ==========================================
   INTEGRALLAB - MOTOR MATEMÁTICO
========================================== */

const $ = id => document.getElementById(id);

const METODOS = [
  "rectangulo",
  "trapecio",
  "simpson13",
  "simpson38"
];

const NOMBRES = {
  rectangulo: "Rectángulo izquierdo",
  trapecio: "Trapecio",
  simpson13: "Simpson 1/3",
  simpson38: "Simpson 3/8"
};

const COLORES = {
  rectangulo: "#58b7ff",
  trapecio: "#bd95ff",
  simpson13: "#63e1ba",
  simpson38: "#ffb66c"
};

const FUNCIONES = {
  sin: Math.sin,
  sen: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  log10: Math.log10,
  floor: Math.floor,
  ceil: Math.ceil
};

const EJEMPLOS = {
  polinomio: {
    f: "x^2+2*x+1",
    a: 0, b: 4, n: 6
  },
  seno: {
    f: "sin(x)",
    a: 0, b: Math.PI, n: 6
  },
  cubica: {
    f: "x^3-2*x+1",
    a: -1, b: 2, n: 6
  },
  exponencial: {
    f: "exp(x)",
    a: 0, b: 1, n: 6
  }
};

let datosActuales = null;
let resultados = {};

/* ==========================================
   1. PORTADA ANIMADA
========================================== */

const botonIngresar = $("btn-ingresar");
const portada = $("portada");

botonIngresar.addEventListener("click", () => {
  if (portada.classList.contains("portada-salida")) {
    return;
  }

  portada.classList.add("portada-salida");

  // Cierra la portada después de la transición.
  window.setTimeout(() => {
    portada.style.display = "none";
    window.scrollTo(0, 0);
  }, 850);
});

/* ==========================================
   2. FORMATO NUMÉRICO
========================================== */

function formato(numero, digitos = 10) {
  if (!Number.isFinite(numero)) return "—";

  if (Math.abs(numero) < 1e-14) {
    numero = 0;
  }

  return Number(
    numero.toPrecision(digitos)
  ).toString();
}

/* ==========================================
   3. ANALIZADOR DE FUNCIONES
   Sin eval() y sin librerías externas.
========================================== */

function crearFuncion(expresion) {
  const texto = expresion.trim()
    .replace(/π/g, "pi")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");

  if (!texto) {
    throw Error("Debes escribir una función f(x).");
  }

  const tokens = [];
  let posicion = 0;

  while (posicion < texto.length) {
    if (/\s/.test(texto[posicion])) {
      posicion++;
      continue;
    }

    const resto = texto.slice(posicion);

    const coincidencia = resto.match(
      /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|^[a-zA-Z_]+|^[+\-*/^()]/
    );

    if (!coincidencia) {
      throw Error(
        "Símbolo no reconocido cerca de: " +
        resto.slice(0, 12)
      );
    }

    const valor = coincidencia[0];

    if (/^(?:\d|\.)/.test(valor)) {
      tokens.push({
        tipo: "numero",
        valor: Number(valor)
      });
    } else if (/^[a-zA-Z_]/.test(valor)) {
      tokens.push({
        tipo: "nombre",
        valor: valor.toLowerCase()
      });
    } else {
      tokens.push({
        tipo: valor,
        valor
      });
    }

    posicion += valor.length;
  }

  let indice = 0;

  function analizar(precedenciaMinima = 0) {
    const token = tokens[indice++];

    if (!token) {
      throw Error("La expresión está incompleta.");
    }

    let izquierda;

    if (token.tipo === "numero") {
      izquierda = () => token.valor;
    }

    else if (token.tipo === "nombre") {
      if (token.valor === "x") {
        izquierda = x => x;
      }

      else if (token.valor === "pi") {
        izquierda = () => Math.PI;
      }

      else if (token.valor === "e") {
        izquierda = () => Math.E;
      }

      else if (
        Object.prototype.hasOwnProperty.call(
          FUNCIONES,
          token.valor
        )
      ) {
        if (tokens[indice++]?.tipo !== "(") {
          throw Error(
            "Escribe " + token.valor +
            "(x) utilizando paréntesis."
          );
        }

        const argumento = analizar(0);

        if (tokens[indice++]?.tipo !== ")") {
          throw Error("Falta cerrar un paréntesis.");
        }

        izquierda = x =>
          FUNCIONES[token.valor](argumento(x));
      }

      else {
        throw Error(
          "Nombre no reconocido: " + token.valor
        );
      }
    }

    else if (token.tipo === "(") {
      izquierda = analizar(0);

      if (tokens[indice++]?.tipo !== ")") {
        throw Error("Falta cerrar un paréntesis.");
      }
    }

    else if (
      token.tipo === "+" ||
      token.tipo === "-"
    ) {
      const derecha = analizar(25);

      izquierda = token.tipo === "-"
        ? x => -derecha(x)
        : x => derecha(x);
    }

    else {
      throw Error(
        "Se esperaba un número, x o un paréntesis."
      );
    }

    const operadores = {
      "+": [10, 11],
      "-": [10, 11],
      "*": [20, 21],
      "/": [20, 21],
      "^": [30, 30]
    };

    while (indice < tokens.length) {
      const operador = tokens[indice].tipo;
      const precedencia = operadores[operador];

      if (
        !precedencia ||
        precedencia[0] < precedenciaMinima
      ) {
        break;
      }

      indice++;

      const derecha = analizar(precedencia[1]);
      const anterior = izquierda;

      switch (operador) {
        case "+":
          izquierda = x =>
            anterior(x) + derecha(x);
          break;

        case "-":
          izquierda = x =>
            anterior(x) - derecha(x);
          break;

        case "*":
          izquierda = x =>
            anterior(x) * derecha(x);
          break;

        case "/":
          izquierda = x =>
            anterior(x) / derecha(x);
          break;

        case "^":
          izquierda = x =>
            Math.pow(anterior(x), derecha(x));
          break;
      }
    }

    return izquierda;
  }

  const evaluar = analizar();

  if (indice !== tokens.length) {
    throw Error(
      "Expresión incorrecta. Utiliza * " +
      "para multiplicar: 2*x."
    );
  }

  return x => {
    const resultado = evaluar(x);

    if (!Number.isFinite(resultado)) {
      throw Error(
        "La función no está definida en x = " +
        formato(x, 8)
      );
    }

    return resultado;
  };
}

/* ==========================================
   4. VALIDAR DATOS DE ENTRADA
========================================== */

function leerDatos() {
  const expresion = $("funcion").value.trim();

  const aTexto = $("limite-a").value.trim();
  const bTexto = $("limite-b").value.trim();
  const nTexto = $("subintervalos").value.trim();

  if (!aTexto || !bTexto || !nTexto) {
    throw Error(
      "Completa todos los campos de entrada."
    );
  }

  const a = Number(aTexto);
  const b = Number(bTexto);
  const n = Number(nTexto);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw Error(
      "Los límites deben ser números válidos."
    );
  }

  if (!(a < b)) {
    throw Error(
      "El límite inferior a debe ser menor " +
      "que el límite superior b."
    );
  }

  if (!Number.isSafeInteger(n) || n <= 0) {
    throw Error(
      "El número n debe ser un entero positivo."
    );
  }

  if (n > 120) {
    throw Error(
      "Utiliza un valor de n entre 1 y 120 " +
      "para mantener fluidas las gráficas."
    );
  }

  const f = crearFuncion(expresion);
  const h = (b - a) / n;

  if (!Number.isFinite(h) || h <= 0) {
    throw Error("El tamaño de paso h no es válido.");
  }

  // Muestreo para detectar problemas de dominio.
  // No garantiza matemáticamente continuidad total.
  const cantidad = Math.max(1501, n * 24);
  const muestras = [];

  for (let i = 0; i < cantidad; i++) {
    const x = a + (b - a) * i / (cantidad - 1);
    const y = f(x);

    if (Math.abs(y) > 1e12) {
      throw Error(
        "La función presenta valores demasiado grandes. " +
        "Revisa posibles singularidades."
      );
    }

    muestras.push({ x, y });
  }

  const nodos = [];

  for (let i = 0; i <= n; i++) {
    const x = a + i * h;

    nodos.push({
      i,
      x,
      y: f(x)
    });
  }

  return {
    expresion,
    a,
    b,
    n,
    h,
    f,
    muestras,
    nodos
  };
}

/* ==========================================
   5. RESTRICCIONES MATEMÁTICAS
========================================== */

function condicionInvalida(metodo, n) {
  if (
    metodo === "simpson13" &&
    n % 2 !== 0
  ) {
    return "n debe ser par";
  }

  if (
    metodo === "simpson38" &&
    n % 3 !== 0
  ) {
    return "n debe ser múltiplo de 3";
  }

  return null;
}

/* ==========================================
   6. COEFICIENTES DE CADA MÉTODO
========================================== */

function coeficiente(metodo, i, n) {
  if (metodo === "rectangulo") {
    return i < n ? 1 : 0;
  }

  if (metodo === "trapecio") {
    return (
      i === 0 || i === n ? 1 : 2
    );
  }

  if (metodo === "simpson13") {
    if (i === 0 || i === n) return 1;

    return i % 2 === 0 ? 2 : 4;
  }

  if (metodo === "simpson38") {
    if (i === 0 || i === n) return 1;

    return i % 3 === 0 ? 2 : 3;
  }

  throw Error("Método desconocido.");
}

/* ==========================================
   7. CÁLCULO DE LAS INTEGRALES
========================================== */

function integrar(metodo, datos) {
  const error = condicionInvalida(
    metodo,
    datos.n
  );

  if (error) {
    throw Error(
      NOMBRES[metodo] +
      " no puede ejecutarse: " + error
    );
  }

  let suma = 0;

  for (const nodo of datos.nodos) {
    suma += (
      coeficiente(metodo, nodo.i, datos.n) *
      nodo.y
    );
  }

  let factor;

  switch (metodo) {
    case "rectangulo":
      factor = datos.h;
      break;

    case "trapecio":
      factor = datos.h / 2;
      break;

    case "simpson13":
      factor = datos.h / 3;
      break;

    case "simpson38":
      factor = 3 * datos.h / 8;
      break;

    default:
      throw Error("Método desconocido.");
  }

  return suma * factor;
}

/* ==========================================
   8. INTERPOLACIÓN DE LAGRANGE
   Permite visualizar las curvas de Simpson.
========================================== */

function interpolar(puntos, x) {
  let total = 0;

  for (let j = 0; j < puntos.length; j++) {
    let base = 1;

    for (let k = 0; k < puntos.length; k++) {
      if (k !== j) {
        base *= (
          (x - puntos[k].x) /
          (puntos[j].x - puntos[k].x)
        );
      }
    }

    total += base * puntos[j].y;
  }

  return total;
}

/* ==========================================
   9. REPRESENTACIÓN GEOMÉTRICA
========================================== */

function aproximacion(metodo, datos, x, segmento) {
  const nodos = datos.nodos;

  if (metodo === "rectangulo") {
    return nodos[segmento].y;
  }

  if (metodo === "trapecio") {
    const primero = nodos[segmento];
    const segundo = nodos[segmento + 1];

    const t = (
      (x - primero.x) /
      (segundo.x - primero.x)
    );

    return (
      primero.y * (1 - t) +
      segundo.y * t
    );
  }

  const tamano = (
    metodo === "simpson13" ? 2 : 3
  );

  const inicio = (
    Math.floor(segmento / tamano) * tamano
  );

  const puntos = nodos.slice(
    inicio,
    inicio + tamano + 1
  );

  return interpolar(puntos, x);
}

/* ==========================================
   10. VALOR DE REFERENCIA
========================================== */

function calcularReferencia(datos) {
  // Simpson 1/3 con alta resolución.
  const n = 6000;
  const h = (datos.b - datos.a) / n;

  let suma = (
    datos.f(datos.a) +
    datos.f(datos.b)
  );

  for (let i = 1; i < n; i++) {
    const x = datos.a + i * h;

    suma += (
      (i % 2 === 0 ? 2 : 4) *
      datos.f(x)
    );
  }

  return (h / 3) * suma;
}

/* ==========================================
   11. MENSAJES
========================================== */

function mostrarMensaje(texto, error = false) {
  const elemento = $("mensaje");

  elemento.textContent = texto;
  elemento.classList.toggle("error", error);
}

/* ==========================================
   12. DIBUJAR EJES Y CUADRÍCULA
========================================== */

function dibujarEjes(ctx, datos, escala) {
  const {
    X,
    Y,
    izquierda,
    arriba,
    ancho,
    alto,
    minimo,
    maximo
  } = escala;

  ctx.fillStyle = "#07192b";
  ctx.fillRect(0, 0, 720, 420);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#24435c";
  ctx.fillStyle = "#9bb8d0";
  ctx.font = "15px Arial";

  // Líneas horizontales.
  for (let j = 0; j <= 4; j++) {
    const y = arriba + alto * j / 4;

    const valor = (
      maximo - (maximo - minimo) * j / 4
    );

    ctx.beginPath();
    ctx.moveTo(izquierda, y);
    ctx.lineTo(izquierda + ancho, y);
    ctx.stroke();

    ctx.fillText(
      formato(valor, 4),
      7,
      y + 5
    );
  }

  // Líneas verticales.
  for (let j = 0; j <= 4; j++) {
    const x = izquierda + ancho * j / 4;

    const valor = (
      datos.a +
      (datos.b - datos.a) * j / 4
    );

    ctx.beginPath();
    ctx.moveTo(x, arriba);
    ctx.lineTo(x, arriba + alto);
    ctx.stroke();

    ctx.fillText(
      formato(valor, 4),
      x - 14,
      402
    );
  }

  // Eje x.
  ctx.beginPath();
  ctx.strokeStyle = "#a0b8d0";
  ctx.lineWidth = 2;

  ctx.moveTo(izquierda, Y(0));
  ctx.lineTo(izquierda + ancho, Y(0));

  ctx.stroke();
}

/* ==========================================
   13. DIBUJAR LAS CUATRO GRÁFICAS
========================================== */

function dibujarGrafica(metodo) {
  const canvas = $("grafica-" + metodo);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 720, 420);

  if (!datosActuales) return;

  const datos = datosActuales;

  const calculado = (
    resultados[metodo] !== null &&
    resultados[metodo] !== undefined
  );

  const valores = datos.muestras.map(
    muestra => muestra.y
  );

  // Incorporar valores interpolados a la escala.
  if (calculado) {
    for (let i = 0; i < datos.n; i++) {
      for (let k = 0; k <= 8; k++) {
        const x = (
          datos.nodos[i].x +
          datos.h * k / 8
        );

        valores.push(
          aproximacion(metodo, datos, x, i)
        );
      }
    }
  }

  let minimo = Math.min(0, ...valores);
  let maximo = Math.max(0, ...valores);

  if (maximo - minimo < 1e-10) {
    minimo -= 1;
    maximo += 1;
  }

  const margen = (maximo - minimo) * .12;

  minimo -= margen;
  maximo += margen;

  const izquierda = 72;
  const arriba = 20;
  const ancho = 620;
  const alto = 350;

  const X = x => (
    izquierda +
    (x - datos.a) / (datos.b - datos.a) * ancho
  );

  const Y = y => (
    arriba +
    (maximo - y) / (maximo - minimo) * alto
  );

  dibujarEjes(ctx, datos, {
    X,
    Y,
    izquierda,
    arriba,
    ancho,
    alto,
    minimo,
    maximo
  });

  const progreso = Number($("progreso").value);

  // Dibujar rectángulos, trapecios o curvas.
  if (calculado) {
    for (
      let i = 0;
      i < Math.min(progreso, datos.n);
      i++
    ) {
      const x0 = datos.nodos[i].x;
      const x1 = datos.nodos[i + 1].x;

      const pasos = (
        metodo === "rectangulo" ? 1 : 16
      );

      ctx.beginPath();
      ctx.moveTo(X(x0), Y(0));

      for (let j = 0; j <= pasos; j++) {
        const x = (
          x0 + (x1 - x0) * j / pasos
        );

        ctx.lineTo(
          X(x),
          Y(aproximacion(metodo, datos, x, i))
        );
      }

      ctx.lineTo(X(x1), Y(0));
      ctx.closePath();

      ctx.fillStyle = COLORES[metodo] + "40";
      ctx.strokeStyle = COLORES[metodo];
      ctx.lineWidth = 1.4;

      ctx.fill();
      ctx.stroke();
    }
  }

  // Curva original f(x).
  ctx.beginPath();
  ctx.strokeStyle = "#65edff";
  ctx.lineWidth = 3.2;

  datos.muestras.forEach((muestra, i) => {
    if (i === 0) {
      ctx.moveTo(
        X(muestra.x),
        Y(muestra.y)
      );
    } else {
      ctx.lineTo(
        X(muestra.x),
        Y(muestra.y)
      );
    }
  });

  ctx.stroke();

  // Puntos de evaluación.
  if (calculado) {
    ctx.fillStyle = "#ffdd83";

    datos.nodos.forEach(nodo => {
      ctx.beginPath();

      ctx.arc(
        X(nodo.x),
        Y(nodo.y),
        datos.n > 45 ? 2 : 3.6,
        0,
        Math.PI * 2
      );

      ctx.fill();
    });
  }

  // Aviso para métodos no ejecutados.
  if (!calculado) {
    const razon = condicionInvalida(
      metodo,
      datos.n
    );

    ctx.fillStyle = "#ffdfbf";
    ctx.font = "bold 19px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
      razon || "Método no calculado",
      360,
      55
    );

    ctx.textAlign = "left";
  }
}

/* ==========================================
   14. DESLIZADOR DIDÁCTICO
========================================== */

function actualizarProgreso() {
  if (!datosActuales) return;

  const cantidad = Number($("progreso").value);
  const total = datosActuales.n;

  $("progreso-texto").textContent = (
    cantidad + " de " + total
  );

  $("paso-titulo").textContent = (
    cantidad + " subintervalos"
  );

  if (cantidad === 0) {
    $("paso-descripcion").textContent = (
      "Inicio: todavía no se han construido " +
      "las figuras de aproximación."
    );
  }

  else if (cantidad === total) {
    $("paso-descripcion").textContent = (
      "Se muestra la construcción completa. " +
      "Compara las cuatro aproximaciones."
    );
  }

  else {
    const x = (
      datosActuales.a +
      cantidad * datosActuales.h
    );

    $("paso-descripcion").textContent = (
      "Se han construido " + cantidad +
      " subintervalos hasta x = " +
      formato(x, 7) + "."
    );
  }

  METODOS.forEach(dibujarGrafica);
}

/* ==========================================
   15. RESULTADOS EN CADA TARJETA
========================================== */

function actualizarTarjetas(datos) {
  METODOS.forEach(metodo => {
    const valor = resultados[metodo];

    const razon = condicionInvalida(
      metodo,
      datos.n
    );

    const tarjeta = document.querySelector(
      '[data-metodo="' + metodo + '"]'
    );

    const estado = $("estado-" + metodo);
    const resultado = $("resultado-" + metodo);
    const detalle = $("detalle-" + metodo);

    const calculado = (
      valor !== null &&
      valor !== undefined
    );

    resultado.textContent = (
      calculado ? formato(valor, 12) : "—"
    );

    tarjeta.classList.toggle(
      "invalida",
      Boolean(razon)
    );

    if (razon) {
      estado.textContent = "No ejecutable";
      estado.className = "estado no-valido";

      detalle.textContent = (
        "No ejecutado: " + razon +
        ". Cambia n manualmente."
      );
    }

    else if (calculado) {
      estado.textContent = "Calculado";
      estado.className = "estado";

      detalle.textContent = (
        NOMBRES[metodo] +
        " calculado con n = " + datos.n + "."
      );
    }

    else {
      estado.textContent = "Sin calcular";
      estado.className = "estado pendiente";

      detalle.textContent = (
        "Este método es válido, " +
        "pero no se seleccionó para el cálculo."
      );
    }
  });
}

/* ==========================================
   16. TABLA DE NODOS
========================================== */

function mostrarNodos(datos) {
  const cuerpo = $("tabla-nodos");
  cuerpo.replaceChildren();

  const fragmento = document.createDocumentFragment();

  datos.nodos.forEach(nodo => {
    const fila = document.createElement("tr");

    const celdas = [
      nodo.i,
      formato(nodo.x, 12),
      formato(nodo.y, 12)
    ];

    METODOS.forEach(metodo => {
      if (condicionInvalida(metodo, datos.n)) {
        celdas.push("—");
      } else {
        celdas.push(
          coeficiente(metodo, nodo.i, datos.n)
        );
      }
    });

    celdas.forEach(valor => {
      const celda = document.createElement("td");

      celda.textContent = String(valor);
      fila.appendChild(celda);
    });

    fragmento.appendChild(fila);
  });

  cuerpo.appendChild(fragmento);
}

/* ==========================================
   17. TABLA COMPARATIVA
========================================== */

function mostrarComparacion(datos) {
  const cuerpo = $("tabla-comparacion");
  cuerpo.replaceChildren();

  let referencia = null;

  try {
    referencia = calcularReferencia(datos);

    if (!Number.isFinite(referencia)) {
      referencia = null;
    }
  } catch {
    referencia = null;
  }

  const clasificacion = [];

  METODOS.forEach(metodo => {
    const fila = document.createElement("tr");

    const valor = resultados[metodo];

    const calculado = (
      valor !== null &&
      valor !== undefined
    );

    const razon = condicionInvalida(
      metodo,
      datos.n
    );

    const diferencia = (
      calculado && referencia !== null
        ? Math.abs(valor - referencia)
        : null
    );

    const estado = razon
      ? "No ejecutable: " + razon
      : calculado
        ? "Válido"
        : "Sin calcular";

    const valores = [
      NOMBRES[metodo],
      calculado ? formato(valor, 12) : "—",
      diferencia === null
        ? "—"
        : formato(diferencia, 9),
      estado
    ];

    valores.forEach((texto, indice) => {
      const celda = document.createElement("td");
      celda.textContent = texto;

      if (indice === 3) {
        celda.className = razon
          ? "advertencia"
          : calculado
            ? "correcto"
            : "";
      }

      fila.appendChild(celda);
    });

    cuerpo.appendChild(fila);

    if (diferencia !== null) {
      clasificacion.push({
        metodo,
        diferencia
      });
    }
  });

  if (referencia === null) {
    $("referencia").textContent = (
      "No fue posible calcular una referencia numérica."
    );

    $("analisis").textContent = (
      "Se muestran las aproximaciones, " +
      "pero no es posible comparar sus errores."
    );

    return;
  }

  $("referencia").textContent = (
    "Referencia estimada mediante Simpson 1/3 " +
    "con 6000 subintervalos: " +
    formato(referencia, 13) +
    ". No es necesariamente el valor exacto."
  );

  clasificacion.sort(
    (a, b) => a.diferencia - b.diferencia
  );

  if (!clasificacion.length) {
    $("analisis").textContent = (
      "No se realizó ningún cálculo."
    );
    return;
  }

  const mejor = clasificacion[0];

  const empatados = clasificacion.filter(
    item => Math.abs(
      item.diferencia - mejor.diferencia
    ) < 1e-9
  );

  const nombres = empatados.map(
    item => NOMBRES[item.metodo]
  ).join(" y ");

  $("analisis").textContent = (
    "Análisis comparativo: " +
    nombres +
    (empatados.length > 1
      ? " presentan las menores diferencias "
      : " presenta la menor diferencia ") +
    "respecto de la referencia numérica (" +
    formato(mejor.diferencia, 9) +
    "). La precisión depende de la función, " +
    "el intervalo y el número de subintervalos."
  );
}

/* ==========================================
   18. ACTUALIZAR RESULTADOS GENERALES
========================================== */

function actualizarSimulador(datos) {
  datosActuales = datos;

  $("mostrar-funcion").textContent = (
    "f(x) = " + datos.expresion
  );

  $("mostrar-intervalo").textContent = (
    "[" + formato(datos.a, 8) +
    ", " + formato(datos.b, 8) + "]"
  );

  $("mostrar-n").textContent = datos.n;
  $("mostrar-h").textContent = formato(datos.h, 12);

  $("progreso").max = datos.n;
  $("progreso").value = datos.n;

  actualizarTarjetas(datos);
  mostrarNodos(datos);
  mostrarComparacion(datos);
  actualizarProgreso();
}

/* ==========================================
   19. EJECUTAR CÁLCULO O COMPARACIÓN
========================================== */

function ejecutar(modo) {
  try {
    const datos = leerDatos();

    const seleccionado = document.querySelector(
      'input[name="metodo"]:checked'
    ).value;

    if (modo === "individual") {
      const razon = condicionInvalida(
        seleccionado,
        datos.n
      );

      if (razon) {
        throw Error(
          NOMBRES[seleccionado] +
          " no puede ejecutarse: " +
          razon +
          ". No se modifica n automáticamente."
        );
      }
    }

    const nuevosResultados = {};

    METODOS.forEach(metodo => {
      nuevosResultados[metodo] = null;
    });

    if (modo === "individual") {
      nuevosResultados[seleccionado] = integrar(
        seleccionado,
        datos
      );
    }

    else {
      METODOS.forEach(metodo => {
        if (!condicionInvalida(metodo, datos.n)) {
          nuevosResultados[metodo] = integrar(
            metodo,
            datos
          );
        }
      });
    }

    resultados = nuevosResultados;
    actualizarSimulador(datos);

    const cantidad = METODOS.filter(
      metodo => resultados[metodo] !== null
    ).length;

    if (modo === "individual") {
      mostrarMensaje(
        "Cálculo realizado mediante " +
        NOMBRES[seleccionado] +
        ". Los otros métodos no fueron ejecutados."
      );
    }

    else {
      mostrarMensaje(
        "Comparación completada: " +
        cantidad + " de 4 métodos ejecutados " +
        "con n = " + datos.n +
        ". Los métodos no válidos se omiten " +
        "sin modificar el valor de n."
      );
    }

  } catch (error) {
    mostrarMensaje(
      "ADVERTENCIA: " + error.message,
      true
    );
  }
}

/* ==========================================
   20. BOTONES PRINCIPALES
========================================== */

$("formulario").addEventListener(
  "submit",
  evento => {
    evento.preventDefault();
    ejecutar("individual");
  }
);

$("comparar").addEventListener(
  "click",
  () => ejecutar("comparar")
);

$("reiniciar").addEventListener(
  "click",
  () => {
    const ejemplo = EJEMPLOS.polinomio;

    $("funcion").value = ejemplo.f;
    $("limite-a").value = ejemplo.a;
    $("limite-b").value = ejemplo.b;
    $("subintervalos").value = ejemplo.n;

    document.querySelector(
      'input[name="metodo"][value="rectangulo"]'
    ).checked = true;

    ejecutar("comparar");
  }
);

/* ==========================================
   21. EJEMPLOS RÁPIDOS
========================================== */

document.querySelectorAll(
  "[data-ejemplo]"
).forEach(boton => {
  boton.addEventListener("click", () => {
    const ejemplo = EJEMPLOS[
      boton.dataset.ejemplo
    ];

    $("funcion").value = ejemplo.f;
    $("limite-a").value = ejemplo.a;
    $("limite-b").value = ejemplo.b;
    $("subintervalos").value = ejemplo.n;

    ejecutar("comparar");
  });
});

/* ==========================================
   22. CONTROL PASO A PASO
========================================== */

$("progreso").addEventListener(
  "input",
  actualizarProgreso
);

$("anterior").addEventListener(
  "click",
  () => {
    if (!datosActuales) return;

    $("progreso").value = Math.max(
      0,
      Number($("progreso").value) - 1
    );

    actualizarProgreso();
  }
);

$("siguiente").addEventListener(
  "click",
  () => {
    if (!datosActuales) return;

    $("progreso").value = Math.min(
      datosActuales.n,
      Number($("progreso").value) + 1
    );

    actualizarProgreso();
  }
);

$("mostrar-todos").addEventListener(
  "click",
  () => {
    if (!datosActuales) return;

    $("progreso").value = datosActuales.n;
    actualizarProgreso();
  }
);

/* ==========================================
   23. EXPORTAR DATOS EN CSV
========================================== */

$("descargar").addEventListener(
  "click",
  () => {
    if (!datosActuales) {
      mostrarMensaje(
        "Primero debes realizar un cálculo.",
        true
      );
      return;
    }

    const datos = datosActuales;

    const filas = [
      [
        "i",
        "xi",
        "f(xi)",
        "rectangulo",
        "trapecio",
        "simpson13",
        "simpson38"
      ].join(",")
    ];

    datos.nodos.forEach(nodo => {
      const fila = [
        nodo.i,
        nodo.x,
        nodo.y
      ];

      METODOS.forEach(metodo => {
        fila.push(
          condicionInvalida(metodo, datos.n)
            ? ""
            : coeficiente(
                metodo,
                nodo.i,
                datos.n
              )
        );
      });

      filas.push(fila.join(","));
    });

    const archivo = new Blob(
      ["\ufeff" + filas.join("\r\n")],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "IntegralLab_Resultados.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  }
);

/* ==========================================
   24. INICIAR EL SIMULADOR
========================================== */

// Calcula los cuatro métodos al cargar.
// La portada seguirá visible hasta pulsar INGRESAR.
ejecutar("comparar");
