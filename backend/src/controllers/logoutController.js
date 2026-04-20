const logoutController = {}

logoutController.logout = async (req, res) =>{
    //Limpiar la cookie que tenga lña informacion
    //de quien inicio session
    res.clearCookie("authCookie");

    return res.status(200).json({message:"sesion cerrada"});
};

export default logoutController;