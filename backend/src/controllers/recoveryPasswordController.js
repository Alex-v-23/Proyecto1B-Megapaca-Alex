import jsonwedtoken from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import nodemailer from "nodemailer"

import HTMLRecoveryEmail from "../utils/sendMailRecovery.js"

import { config } from "../../config.js";

import customerModel from "../models/customers.js"

//Array de funciones
const recoveryPasswordController ={}

recoveryPasswordController.requestCode = async (req, res) =>{
try{
//1-solicitamos datos
const {email} = req.body

//validar que el correo exista en la base de datos
const userFound = await customerModel.findOne({email});

if(!userFound){
    return res.status(404).json({message:"user not found"})
}
//generara codigo aleatorio
const randomCode = crypto.randomBytes(3).toString("hex")
//guardar todo en un token
const token = jsonwedtoken.sign(
    //1- ¿que vamos a guardar?
    {email,
    randomCode,
    userType: "customer",
    verified:false
    },
    //2- clave secreta
    config.JWT.secret,
    //3-¿CUANDO ESPIRA?
    {expiresIn: "15m"}
)

res.cookie("recoveryCookie", token,{maxAge: 15 * 60 * 1000})
//Enviar por correo electronico el correo que generamos

// 1- ¿quien lo envia?
const transporte = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: config.email.user_email,
        pass: config.email.user_password
    }
})

//2- ¿quien lo recibe y como ?
const mailOptions = {
    from : config.email.user_email,
    to: email,
    subject: "Codigo de recupercion",
    body: "El codigo expira en 15 minutos",
    html: HTMLRecoveryEmail(randomCode)
}

// 3- Enviar el correo electronico
transporte.sendMail(mailOptions,(error,info)=>{
    if(error){
        return res.status(500).json({message:"error sending email"})
    }
})
return res.status(200).json ({message: "email sent"})
}catch(error){
    console.log("error"+error)
    return res.status(500).json({message: "Internal server error"})
}

};

recoveryPasswordController.verifyCode = async (req, res) =>{
    try{
        //1- solicitamos los datos
        const {code} = req.body
        const token = req.cookies.recoveryCookie;

        const decoded = jsonwedtoken.verify(token, config.JWT.secret);
        //Ahora comparo el codigo que el usuario escribio
        //con el que esta dentro del codigo
        if(code !== decoded.randomCode){
            return res.status(400).json({mesage:"Invalid code"})
        }
        // En cambio, si escribe bien el codigo
        //vamos a colocar el token que ya esta verificado
        const newToken = jsonwedtoken.sign(
            //1- ¿que vamos a guardar?
            {
                email: decoded.email,
                userType: "customer",
                verified: true
            },
            //2- clave secreta
             config.JWT.secret,
             //3-¿CUANDO ESPIRA?
             {expiresIn: "15m"}
            );
            res.cookie("recoveryCookie",newToken,{maxAge: 15 * 60 * 1000})
            return res.status(200).json ({message: "code verified succesfully"})
        }catch(error){
        console.log("error"+error)
    return res.status(500).json({message: "Internal server error"})
    }
};

recoveryPasswordController.newPassword = async (req, res) => {
    try{
        //1- solicitamos datos
        const {newPassword, confirmNewPassword} = req.body;

        //comparo las dos contraseñas
        if(newPassword !== confirmNewPassword){
            return res.status(400).json({messsage:"Password doesnt match"})
        }

        //vanos a comprobar que la constate verified que esta en el token
        //ya este en el true(o sea que haya pasado por el paso 2)
        const token= req.cookies.recoveryCookie;
        const decoded = jsonwedtoken.verify(token, config.JWT.secret);

        if(!decoded.verified){
            return res.status(400).json({message: "code not verified"})
        }

        ///////
        //Encriptar
        const passwordHash = await bcrypt.hash (newPassword, 10);

        //Actualizamos la nueva contraseña en la base de datos
        await customerModel.findOneAndUpdate(
            {email: decoded.email},
            {password: passwordHash},
            {new: true}
        );

        res.clearCookie("recoveryCookiee");

        return res.status(200).json({message: "Pasword Update"})
    }catch(error){
        console.log("error"+error)
    return res.status(500).json({message: "Internal server error"})
    }
};

export default recoveryPasswordController;