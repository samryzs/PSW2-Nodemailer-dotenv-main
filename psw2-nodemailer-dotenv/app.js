require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");

const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.get("/", (req, res) => {
  res.render("index", {
    errors: [],
    old: {},
    success: null
  });
});

app.post(
  "/enviar",
  [
    body("nome")
      .trim()
      .notEmpty()
      .withMessage("Informe seu nome.")
      .isLength({ min: 2 })
      .withMessage("O nome deve ter pelo menos 2 caracteres."),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Informe seu e-mail.")
      .isEmail()
      .withMessage("Informe um e-mail válido."),

    body("telefone")
      .trim()
      .notEmpty()
      .withMessage("Informe seu telefone.")
      .isLength({ min: 8 })
      .withMessage("Informe um telefone válido."),

    body("assunto")
      .trim()
      .notEmpty()
      .withMessage("Informe o assunto."),

    body("mensagem")
      .trim()
      .notEmpty()
      .withMessage("Informe a mensagem.")
      .isLength({ min: 5 })
      .withMessage("A mensagem deve ter pelo menos 5 caracteres.")
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("index", {
        errors: errors.array(),
        old: req.body,
        success: null
      });
    }

    const { nome, email, telefone, assunto, mensagem } = req.body;

    try {
      await transporter.sendMail({
        from: `"Formulário de Contato" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: email,
        subject: `Contato do site: ${assunto}`,
        text: [
          `Nome: ${nome}`,
          `E-mail: ${email}`,
          `Telefone: ${telefone}`,
          `Assunto: ${assunto}`,
          "",
          "Mensagem:",
          mensagem
        ].join("\n"),
        html: `
          <h2>Novo contato pelo formulário</h2>
          <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
          <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
          <p><strong>Telefone:</strong> ${escapeHtml(telefone)}</p>
          <p><strong>Assunto:</strong> ${escapeHtml(assunto)}</p>
          <hr>
          <p><strong>Mensagem:</strong></p>
          <p>${escapeHtml(mensagem).replace(/\n/g, "<br>")}</p>
        `
      });

      return res.render("index", {
        errors: [],
        old: {},
        success: "Mensagem enviada com sucesso! Verifique seu e-mail."
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);

      return res.status(500).render("index", {
        errors: ["Não foi possível enviar o e-mail. Verifique as configurações do .env."],
        old: req.body,
        success: null
      });
    }
  }
);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});