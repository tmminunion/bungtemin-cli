module.exports = async (req, res) => {
    const firstNames = [
        "Arshaka", "Alvaro", "Arjun", "Azka", "Abidzar", "Arvin", "Azzam", "Ararya", "Arkana", "Aidan", 
        "Adnan", "Alfarezel", "Affan", "Atharrazka", "Arshaan", "Kenzie", "Kenzo", "Keanu", "Khalif", 
        "Khafiz", "Kaivan", "Kalandra", "Khaizan", "Kylo", "Keenan", "Khadavy", "Khairy", "Zayan", 
        "Zayyan", "Zavier", "Zaidan", "Zidan", "Zhafif", "Zayden", "Zufar", "Zayn", "Rayyan", 
        "Rafardhan", "Rafif", "Rafisqy", "Raffa", "Rakha", "Rashaad", "Raynar", "Reynald", "Rizqi", 
        "Gibran", "Ghazi", "Ghazawan", "Galang", "Gavin", "Ghaisan", "Ghani", "Ghazali", "Farezel", 
        "Farrel", "Fathan", "Faiz", "Fakhri", "Fauzan", "Faris", "Fathian", "Dzuhairi", "Eshan", "Ezra"
    ];

    const middleNames = [
        "Pradana", "Narendra", "Wiratama", "Abimanyu", "Baskara", "Satya", "Putra", "Aditya", 
        "Pramudya", "Mahendra", "Wicaksono", "Anugrah", "Darmawan", "Setiawan", "Arkan", 
        "Hamizan", "Arfathan", "Khalifi", "Shaquille", "Zulfan", "Al-Fatih", "Al-Ghifari"
    ];

    const lastNames = [
        "Nugraha", "Kurniawan", "Saputra", "Alamsyah", "Hidayat", "Permana", "Syahputra", 
        "Prasetyo", "Gunawan", "Kusuma", "Wibowo", "Ramadhan", "Fauzi", "Irawan", "Wijaya"
    ];

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const result = {
        gender: "Laki-laki",
        modern_name: `${pick(firstNames)} ${pick(middleNames)} ${pick(lastNames)}`,
        alternatives: Array.from({ length: 3 }, () => `${pick(firstNames)} ${pick(middleNames)} ${pick(lastNames)}`)
    };

    res.json({
        status: true,
        message: "Berhasil generate nama anak laki-laki Indonesia kekinian",
        data: result
    });
};

module.exports.auth = false;