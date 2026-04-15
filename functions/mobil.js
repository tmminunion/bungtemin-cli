module.exports = async (req, res) => {
  const toyotaModels = [
    "Agya", 
    "Avanza", 
    "Veloz", 
    "Calya", 
    "Innova Zenix", 
    "Fortuner", 
    "Rush", 
    "Raize", 
    "Yaris", 
    "Vios", 
    "Camry", 
    "Corolla Altis", 
    "Corolla Cross",
    "Alphard", 
    "Vellfire", 
    "Land Cruiser", 
    "Hilux", 
    "Hiace", 
    "GR Supra", 
    "GR86"
  ];
  const randomCar = toyotaModels[Math.floor(Math.random() * toyotaModels.length)];
  
  res.json({
    status: true,
    brand: "Toyota",
    model: randomCar
  });
};

module.exports.auth = false;