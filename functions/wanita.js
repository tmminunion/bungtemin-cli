module.exports = async (req, res) => {
    const listNama = [
        "Siti Nurhaliza", "Neng Lilis", "Ayu Lestari", "Dewi Sartika", "Rina Marlina", 
        "Sri Wahyuni", "Euis Permata", "Cucu Cahyati", "Indah Rahmawati", "Siska Amelia",
        "Putri Karawang", "Mira Santika", "Yanti Suryanti", "Nina Herlina", "Dedeh Rosidah",
        "Aisyah Humaira", "Fatimah Az-Zahra", "Khadijah Al-Kubra", "Zahra Syahira", "Layla Shofia",
        "Jessica Williams", "Emily Watson", "Catherine Miller", "Sarah Johnson", "Chloe Elizabeth",
        "Mei Ling Chen", "Xiao Wei", "Li Hua", "Zhang Jing", "Lin Xi",
        "Sakura Tanaka", "Yuki Himari", "Hana Mitsuki", "Rin Kawasaki", "Aoi Sora",
        "Kim Ji-soo", "Park Shin-hye", "Lee Sung-kyung", "Choi Min-young", "Kang Ha-na"
    ];

    const listDaerah = [
        "Telukjambe Timur", "Telukjambe Barat", "Karawang Barat", "Karawang Timur", 
        "Klari", "Cikampek", "Kotabaru", "Jatisari", "Pedes", "Rengasdengklok",
        "Rawamerta", "Batujaya", "Tirtajaya", "Pangkalan", "Tegalwaru"
    ];

    const listHobby = [
        "Memasak", "Shopping", "Traveling", "Menyanyi", "Menonton Film", 
        "Berenang", "Membaca", "Olahraga", "Menari", "Kuliner"
    ];

    const namaAcak = listNama[Math.floor(Math.random() * listNama.length)];
    const daerahAcak = listDaerah[Math.floor(Math.random() * listDaerah.length)];
    const hobbyAcak = listHobby[Math.floor(Math.random() * listHobby.length)];
    
    const noCelanaAcak = Math.floor(Math.random() * (34 - 26 + 1)) + 26;
    const noBraAcak = Math.floor(Math.random() * (40 - 32 + 1)) + 32;

    const umurAcak = Math.floor(Math.random() * (35 - 19 + 1)) + 19;
    const tahunSekarang = new Date().getFullYear();
    const tahunLahir = tahunSekarang - umurAcak;
    const bulanLahir = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const hariLahir = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const tanggalLahirAcak = `${hariLahir}-${bulanLahir}-${tahunLahir}`;

    res.json({
        nama_wanita: namaAcak,
        asal_daerah: daerahAcak,
        kabupaten: "Karawang",
        umur: umurAcak,
        tanggal_lahir: tanggalLahirAcak,
        no_celana: noCelanaAcak,
        no_bra: noBraAcak,
        hobby: hobbyAcak
    });
};