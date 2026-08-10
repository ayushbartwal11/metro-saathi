// Delhi Metro network data (all operational lines & stations)
const LINES = [
  {
    id: "red", name: "Red Line", num: "Line 1", color: "#e2231a",
    anchors: [[905,205],[790,235],[665,285],[545,300],[430,268],[300,232],[152,192]],
    stations: ["Shaheed Sthal (New Bus Adda)","Hindon River","Arthala","Mohan Nagar","Shyam Park","Major Mohit Sharma Rajendra Nagar","Raj Bagh","Shaheed Nagar","Dilshad Garden","Jhilmil","Mansarovar Park","Shahdara","Welcome","Seelampur","Shastri Park","Kashmere Gate","Tis Hazari","Pulbangash","Pratap Nagar","Shastri Nagar","Inderlok","Kanhaiya Nagar","Keshav Puram","Netaji Subhash Place","Kohat Enclave","Pitampura","Rohini East","Rohini West","Rithala"]
  },
  {
    id: "yellow", name: "Yellow Line", num: "Line 2", color: "#f5d000",
    anchors: [[520,58],[528,180],[545,300],[532,400],[520,478],[528,600],[500,760],[470,930]],
    stations: ["Samaypur Badli","Rohini Sector 18-19","Haiderpur Badli Mor","Jahangirpuri","Adarsh Nagar","Azadpur","Model Town","Guru Teg Bahadur Nagar","Vishwavidyalaya","Vidhan Sabha","Civil Lines","Kashmere Gate","Chandni Chowk","Chawri Bazar","New Delhi","Rajiv Chowk","Patel Chowk","Central Secretariat","Udyog Bhawan","Lok Kalyan Marg","Jor Bagh","INA","AIIMS","Green Park","Hauz Khas","Malviya Nagar","Saket","Qutab Minar","Chhatarpur","Sultanpur","Ghitorni","Arjan Garh","Guru Dronacharya","Sikanderpur","MG Road","IFFCO Chowk","Millennium City Centre Gurugram (HUDA City Centre)"]
  },
  {
    id: "blue", name: "Blue Line", num: "Line 3", color: "#0057b8",
    anchors: [[118,522],[210,505],[318,492],[420,486],[520,478],[620,470],[706,470],[800,492],[905,528]],
    stations: ["Dwarka Sector 21","Dwarka Sector 8","Dwarka Sector 9","Dwarka Sector 10","Dwarka Sector 11","Dwarka Sector 12","Dwarka Sector 13","Dwarka Sector 14","Dwarka","Dwarka Mor","Nawada","Uttam Nagar West","Uttam Nagar East","Janakpuri West","Janakpuri East","Tilak Nagar","Subhash Nagar","Tagore Garden","Rajouri Garden","Ramesh Nagar","Moti Nagar","Kirti Nagar","Shadipur","Patel Nagar","Rajendra Place","Karol Bagh","Jhandewalan","Ramakrishna Ashram Marg","Rajiv Chowk","Barakhamba Road","Mandi House","Supreme Court (Pragati Maidan)","Indraprastha","Yamuna Bank","Akshardham","Mayur Vihar-I","Mayur Vihar Extension","New Ashok Nagar","Noida Sector 15","Noida Sector 16","Noida Sector 18","Botanical Garden","Golf Course","Noida City Centre","Noida Sector 34","Noida Sector 52","Noida Sector 61","Noida Sector 59","Noida Sector 62","Noida Electronic City"]
  },
  {
    id: "blue-branch", name: "Blue Line Branch", num: "Line 4", color: "#3b8ede",
    anchors: [[706,470],[760,430],[820,400],[880,382]],
    stations: ["Yamuna Bank","Laxmi Nagar","Nirman Vihar","Preet Vihar","Karkarduma","Anand Vihar ISBT","Kaushambi","Vaishali"]
  },
  {
    id: "green", name: "Green Line", num: "Line 5", color: "#00a651",
    anchors: [[430,268],[350,300],[250,338],[150,372],[60,392]],
    stations: ["Inderlok","Ashok Park Main","Punjabi Bagh","Shivaji Park","Madipur","Paschim Vihar East","Paschim Vihar West","Peera Garhi","Udyog Nagar","Maharaja Surajmal Stadium","Nangloi","Nangloi Railway Station","Rajdhani Park","Mundka","Mundka Industrial Area (MIA)","Ghevra Metro Station","Tikri Kalan","Tikri Border","Pandit Shree Ram Sharma","Bahadurgarh City","Brigadier Hoshiyar Singh"]
  },
  {
    id: "green-branch", name: "Green Line Branch", num: "Line 5A", color: "#5fcf8d",
    anchors: [[368,292],[360,360],[368,430]],
    stations: ["Ashok Park Main","Satguru Ram Singh Marg","Kirti Nagar"]
  },
  {
    id: "violet", name: "Violet Line", num: "Line 6", color: "#7b2d8e",
    anchors: [[545,300],[590,368],[604,432],[540,470],[520,540],[578,632],[652,760],[712,940]],
    stations: ["Kashmere Gate","Lal Qila","Jama Masjid","Delhi Gate","ITO","Mandi House","Janpath","Central Secretariat","Khan Market","Jawaharlal Nehru Stadium","Jangpura","Lajpat Nagar","Moolchand","Kailash Colony","Nehru Place","Kalkaji Mandir","Govind Puri","Harkesh Nagar Okhla","Jasola Apollo","Sarita Vihar","Mohan Estate","Tughlakabad Station","Badarpur Border","Sarai","NHPC Chowk","Mewala Maharajpur","Sector 28 Faridabad","Badkal Mor","Old Faridabad","Neelam Chowk Ajronda","Bata Chowk","Escorts Mujesar","Sant Surdas (Sihi)","Raja Nahar Singh (Ballabhgarh)"]
  },
  {
    id: "pink", name: "Pink Line", num: "Line 7", color: "#e6417f",
    anchors: [[478,138],[400,168],[300,232],[262,330],[268,432],[300,556],[400,606],[500,624],[560,662],[660,640],[758,596],[822,500],[820,400],[760,330],[700,288],[760,222],[812,178]],
    stations: ["Majlis Park","Azadpur","Shalimar Bagh","Netaji Subhash Place","Shakurpur","Punjabi Bagh West","ESI Hospital","Rajouri Garden","Mayapuri","Naraina Vihar","Delhi Cantt","Durgabai Deshmukh South Campus","Sir Vishweshwaraiah Moti Bagh","Bhikaji Cama Place","Sarojini Nagar","INA","South Extension","Lajpat Nagar","Vinobapuri","Ashram","Sarai Kale Khan - Nizamuddin","Mayur Vihar-I","Mayur Vihar Pocket 1","Trilokpuri Sanjay Lake","East Vinod Nagar - Mayur Vihar-II","Mandawali - West Vinod Nagar","IP Extension","Anand Vihar ISBT","Karkarduma","Karkarduma Court","Krishna Nagar","East Azad Nagar","Welcome","Jaffrabad","Maujpur-Babarpur","Gokulpuri","Johri Enclave","Shiv Vihar"]
  },
  {
    id: "magenta", name: "Magenta Line", num: "Line 8", color: "#b5179e",
    anchors: [[236,478],[268,556],[318,610],[400,648],[470,692],[560,716],[652,714],[760,640],[840,566]],
    stations: ["Janakpuri West","Dabri Mor - Janakpuri South","Dashrath Puri","Palam","Sadar Bazaar Cantonment","Terminal 1 IGI Airport","Shankar Vihar","Vasant Vihar","Munirka","R.K. Puram","IIT Delhi","Hauz Khas","Panchsheel Park","Chirag Delhi","Greater Kailash","Nehru Enclave","Kalkaji Mandir","Okhla NSIC","Sukhdev Vihar","Jamia Millia Islamia","Okhla Vihar","Jasola Vihar Shaheen Bagh","Kalindi Kunj","Okhla Bird Sanctuary","Botanical Garden"]
  },
  {
    id: "grey", name: "Grey Line", num: "Line 9", color: "#8d99ae",
    anchors: [[196,516],[150,570],[104,626],[70,668]],
    stations: ["Dwarka","Nangli","Najafgarh","Dhansa Bus Stand"]
  },
  {
    id: "orange", name: "Airport Express", num: "Orange Line", color: "#f47b20",
    anchors: [[500,468],[430,500],[350,538],[262,580],[180,556],[118,522]],
    stations: ["New Delhi","Shivaji Stadium","Dhaula Kuan","Delhi Aerocity","IGI Airport Terminal 3","Dwarka Sector 21","Yashobhoomi Dwarka Sector 25"]
  },
  {
    id: "aqua", name: "Aqua Line", num: "Noida–Greater Noida", color: "#00b4d8",
    anchors: [[860,470],[930,560],[950,680],[912,812]],
    stations: ["Noida Sector 51","Noida Sector 50","Noida Sector 76","Noida Sector 101","Noida Sector 81","NSEZ","Noida Sector 83","Noida Sector 137","Noida Sector 142","Noida Sector 143","Noida Sector 144","Noida Sector 145","Noida Sector 146","Noida Sector 147","Noida Sector 148","Knowledge Park II","Pari Chowk","Alpha 1","Delta 1","GNIDA Office","Depot Station"]
  }
];

// Walking interchanges between physically separate but linked stations
const WALK_LINKS = [
  ["Noida Sector 52", "Noida Sector 51", 6],
  ["Ashram", "Sarai Kale Khan - Nizamuddin", 0]
];

const LANDMARKS = {
  "Red Fort": "Lal Qila",
  "Qutub Minar": "Qutab Minar",
  "India Gate": "Supreme Court (Pragati Maidan)",
  "Lotus Temple": "Kalkaji Mandir",
  "Akshardham Temple": "Akshardham",
  "Connaught Place": "Rajiv Chowk",
  "Airport T3": "IGI Airport Terminal 3",
  "Airport T1": "Terminal 1 IGI Airport",
  "Humayun's Tomb": "Jawaharlal Nehru Stadium",
  "Chandni Chowk Market": "Chandni Chowk",
  "Sarojini Market": "INA",
  "Hauz Khas Village": "Hauz Khas",
  "Select Citywalk": "Malviya Nagar",
  "ISBT Kashmere Gate": "Kashmere Gate",
  "New Delhi Railway Station": "New Delhi",
  "Nizamuddin Railway Station": "Sarai Kale Khan - Nizamuddin"
};