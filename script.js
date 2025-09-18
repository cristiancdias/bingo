const telaInicial = document.getElementById("tela-inicial")
const telaCartelas = document.getElementById("tela-cartelas")
const telaJogo = document.getElementById("tela-jogo")

let imagemCentralBase64 = null

/**
 * Converte um SVG em PNG (base64) para evitar cortes no PDF
 * @param {File|string} svgTextOrFile - SVG como texto ou arquivo
 * @param {number} width - Largura desejada em pixels
 * @param {number} height - Altura desejada em pixels
 * @param {number} scale - Fator de escala para qualidade
 * @returns {Promise<string>} DataURL em PNG
 */
function svgFileToPngDataUrl(
  svgTextOrFile,
  width = 120,
  height = 120,
  scale = 2
) {
  return new Promise(async (resolve, reject) => {
    try {
      let svgText
      if (typeof svgTextOrFile === "string") {
        svgText = svgTextOrFile
      } else {
        // Ler conteúdo do arquivo SVG
        svgText = await svgTextOrFile.text()
      }

      // Converter SVG em Base64
      const svg64 = btoa(unescape(encodeURIComponent(svgText)))
      const b64start = "data:image/svg+xml;base64,"
      const img = new Image()

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = width * scale
          canvas.height = height * scale
          const ctx = canvas.getContext("2d")

          // Fundo branco para evitar transparência estranha
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Desenhar SVG como imagem no canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // Converter para PNG
          const png = canvas.toDataURL("image/png")
          resolve(png)
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = e =>
        reject(new Error("Falha ao carregar SVG: " + e.message))
      img.src = b64start + svg64
    } catch (err) {
      reject(err)
    }
  })
}

// Evento de upload do arquivo
document
  .getElementById("imagemCentral")
  .addEventListener("change", async function (event) {
    const file = event.target.files[0]
    if (!file) return

    // Detecta se o arquivo é SVG
    if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
      try {
        console.log("Convertendo SVG para PNG...")
        imagemCentralBase64 = await svgFileToPngDataUrl(file, 120, 120, 2)
        console.log("Conversão concluída com sucesso!")
      } catch (err) {
        console.error("Erro convertendo SVG:", err)
        // Fallback: tentar ler como dataURL direto
        const reader = new FileReader()
        reader.onload = e => (imagemCentralBase64 = e.target.result)
        reader.readAsDataURL(file)
      }
    } else {
      // Caso seja PNG ou JPG
      const reader = new FileReader()
      reader.onload = function (e) {
        imagemCentralBase64 = e.target.result
      }
      reader.readAsDataURL(file)
    }
  })

function mostrarCartelas() {
  telaInicial.classList.add("hidden")
  telaCartelas.classList.remove("hidden")
}

function mostrarJogo() {
  telaInicial.classList.add("hidden")
  telaJogo.classList.remove("hidden")
  iniciarJogo()
}

function voltar() {
  telaCartelas.classList.add("hidden")
  telaJogo.classList.add("hidden")
  telaInicial.classList.remove("hidden")
}

//Geração de Cartelas
function gerarCartelas() {
  const qtd = parseInt(document.getElementById("qtdCartelas").value)
  const preview = document.getElementById("preview")
  preview.innerHTML = ""

  for (let i = 0; i < qtd; i++) {
    preview.appendChild(criarCartela())
  }
  document.getElementById("btnPDF").classList.remove("hidden")
}

function criarCartela() {
  const colunas = {
    B: gerarNumeros(1, 15),
    I: gerarNumeros(16, 30),
    N: gerarNumeros(31, 45),
    G: gerarNumeros(46, 60),
    O: gerarNumeros(61, 75)
  }
  const div = document.createElement("div")
  div.classList.add("cartela")
  const tabela = document.createElement("table")

  const header = document.createElement("tr")
  for (let letra of ["B", "I", "N", "G", "O"]) {
    const th = document.createElement("td")
    th.innerText = letra
    header.appendChild(th)
  }
  tabela.appendChild(header)

  for (let i = 0; i < 5; i++) {
    const tr = document.createElement("tr")
    for (let letra of ["B", "I", "N", "G", "O"]) {
      const td = document.createElement("td")
      if (letra === "N" && i === 2) {
        td.classList.add("free")
        if (imagemCentralBase64) {
          const img = document.createElement("img")
          img.src = imagemCentralBase64
          td.appendChild(img)
        } else {
          td.innerText = "★"
        }
      } else {
        td.innerText = colunas[letra][i]
      }
      tr.appendChild(td)
    }
    tabela.appendChild(tr)
  }
  div.appendChild(tabela)
  return div
}

function gerarNumeros(min, max) {
  const nums = []
  while (nums.length < 5) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min
    if (!nums.includes(n)) nums.push(n)
  }
  return nums
}

async function gerarPDF() {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const cartelas = document.querySelectorAll(".cartela")
  let x = 10,
    y = 10
  let count = 0

  for (let i = 0; i < cartelas.length; i++) {
    const canvas = await html2canvas(cartelas[i], {
      scale: 2,
      backgroundColor: null,
      useCors: true
    })
    const imgData = canvas.toDataURL("image/png")

    doc.addImage(imgData, "PNG", x, y, 88, 88)

    x += 100
    count++
    if (count % 2 === 0) {
      x = 10
      y += 100
    }
    if (count % 4 === 0 && i < cartelas.length - 1) {
      doc.addPage()
      x = 10
      y = 10
    }
  }
  doc.save("cartelas.pdf")
}

// ------------------- Jogo -------------------
let pedras = []
let sorteadas = []

function iniciarJogo() {
  pedras = []
  sorteadas = []
  for (let i = 1; i <= 75; i++) pedras.push(i)
  document.getElementById("pedraAtual").innerText = "-"
  gerarTabelaJogo()
}

function gerarTabelaJogo() {
  const container = document.getElementById("tabela-jogo-container")
  container.innerHTML = ""
  const tabela = document.createElement("table")

  const header = document.createElement("tr")
  for (let letra of ["B", "I", "N", "G", "O"]) {
    const th = document.createElement("th")
    th.colSpan = 2
    th.innerText = letra
    th.classList.add("espaco-coluna")
    header.appendChild(th)
  }
  tabela.appendChild(header)

  for (let i = 0; i < 8; i++) {
    const tr = document.createElement("tr")
    for (let col = 0; col < 5; col++) {
      const inicio = col * 15 + 1
      const meio = inicio + 8
      let numeroEsq = i + inicio
      let numeroDir = i + meio

      const tdEsq = document.createElement("td")
      if (numeroEsq <= inicio + 7) {
        tdEsq.id = `num-${numeroEsq}`
        tdEsq.innerText = numeroEsq
      } else {
        tdEsq.innerText = ""
      }
      tr.appendChild(tdEsq)

      const tdDir = document.createElement("td")
      if (numeroDir <= inicio + 14) {
        tdDir.id = `num-${numeroDir}`
        tdDir.innerText = numeroDir
      } else {
        tdDir.innerText = ""
      }
      tr.appendChild(tdDir)

      if (col < 5) {
        tdDir.classList.add("espaco-coluna")
        tdEsq.classList.add("espaco-coluna")
      }
    }
    tabela.appendChild(tr)
  }
  container.appendChild(tabela)
}

function sortearPedra() {
  if (pedras.length === 0) {
    alert("Todas as pedras já foram sorteadas!")
    return
  }
  const idx = Math.floor(Math.random() * pedras.length)
  const numero = pedras.splice(idx, 1)[0]
  sorteadas.push(numero)

  const letra = getLetra(numero)
  document.getElementById("pedraAtual").innerText = letra + " - " + numero

  const celula = document.getElementById(`num-${numero}`)
  if (celula) celula.classList.add("sorteado")
}

function getLetra(num) {
  if (num <= 15) return "B"
  if (num <= 30) return "I"
  if (num <= 45) return "N"
  if (num <= 60) return "G"
  return "O"
}
