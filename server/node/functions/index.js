const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const mercadopago = require("mercadopago"); // Importando o SDK do MercadoPago

// Configurando o MercadoPago com variável de ambiente
mercadopago.configure({
    access_token: 'APP_USR-4439940156964826-120801-a53612bd0230807dbbb51078006fedcb-2131451297',
});

// Configurando o servidor Express
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// Endpoint para criar a preferência de pagamento
app.post("/create_preference", (req, res) => {
    const { description, price, quantity } = req.body;

    if (!description || !price || !quantity) {
        return res.status(400).json({ message: "Dados inválidos ou incompletos." });
    }

    const preference = {
        items: [
            {
                title: description,
                unit_price: Number(price),
                quantity: Number(quantity),
            }
        ],
        back_urls: {
            success: "https://seusite.com/success",  // Substitua diretamente aqui
            failure: "https://seusite.com/failure",
            pending: "https://seusite.com/pending",
        },
        auto_return: "approved",
    };

    mercadopago.preferences.create(preference)
        .then(response => {
            res.json({
                id: response.body.id,
                init_point: response.body.init_point, // URL para o Checkout Pro
            });
        })
        .catch(error => {
            functions.logger.error("Erro ao criar a preferência:", error);
            res.status(500).json({ message: "Erro ao criar a preferência", error: error.message });
        });
});

// Endpoint para lidar com o feedback após o pagamento
app.get('/feedback', (req, res) => {
    res.json({
        Payment: req.query.payment_id,
        Status: req.query.status,
        MerchantOrder: req.query.merchant_order_id,
    });
});

// Exportando o app como uma função do Firebase
exports.api = functions.https.onRequest(app);
