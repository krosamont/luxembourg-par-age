/* The story of the city, told along the timeline, in English, French and Luxembourgish. Read by app.js. */
window.STORY = {
    // who held the city: before 1815 by ruling house or power, after by grand duke
    rulers: [
        { from: 963, to: 1136, short: { en: "Ardenne", fr: "Ardenne", lb: "Ardennen" }, name: { en: "Counts of the House of Ardenne", fr: "Comtes de la maison d'Ardenne", lb: "Grafe vum Haus Ardennen" } },
        { from: 1136, to: 1247, short: { en: "Namur", fr: "Namur", lb: "Namur" }, name: { en: "Counts of the House of Namur", fr: "Comtes de la maison de Namur", lb: "Grafe vum Haus Namur" } },
        { from: 1247, to: 1443, short: { en: "Luxembourg", fr: "Luxembourg", lb: "Lëtzebuerg" }, name: { en: "House of Luxembourg", fr: "Maison de Luxembourg", lb: "Haus Lëtzebuerg" } },
        { from: 1443, to: 1482, short: { en: "Burgundy", fr: "Bourgogne", lb: "Burgund" }, name: { en: "Dukes of Burgundy", fr: "Ducs de Bourgogne", lb: "Herzoge vu Burgund" } },
        { from: 1482, to: 1555, short: { en: "Habsburg", fr: "Habsbourg", lb: "Habsburg" }, name: { en: "Habsburgs", fr: "Habsbourg", lb: "Habsburger" } },
        { from: 1555, to: 1684, short: { en: "Spain", fr: "Espagne", lb: "Spuenien" }, name: { en: "Spanish Habsburgs", fr: "Habsbourg d'Espagne", lb: "Spuenesch Habsburger" } },
        { from: 1684, to: 1697, short: { en: "France", fr: "France", lb: "Frankräich" }, name: { en: "King Louis XIV of France", fr: "Louis XIV, roi de France", lb: "De franséische Kinnek Louis XIV" } },
        { from: 1697, to: 1714, short: { en: "Spain", fr: "Espagne", lb: "Spuenien" }, name: { en: "Spanish Habsburgs", fr: "Habsbourg d'Espagne", lb: "Spuenesch Habsburger" } },
        { from: 1714, to: 1795, short: { en: "Austria", fr: "Autriche", lb: "Éisträich" }, name: { en: "Austrian Habsburgs", fr: "Habsbourg d'Autriche", lb: "Éisträichesch Habsburger" } },
        { from: 1795, to: 1815, short: { en: "France", fr: "France", lb: "Frankräich" }, name: { en: "French Republic and Empire", fr: "République et Empire français", lb: "Franséisch Republik an Eemper" } },
        { from: 1815, to: 1840, short: { en: "William I", fr: "Guillaume Ier", lb: "Wëllem I." }, name: { en: "Grand Duke William I", fr: "Grand-duc Guillaume Ier", lb: "Groussherzog Wëllem I." } },
        { from: 1840, to: 1849, short: { en: "W. II", fr: "G. II", lb: "W. II" }, name: { en: "Grand Duke William II", fr: "Grand-duc Guillaume II", lb: "Groussherzog Wëllem II." } },
        { from: 1849, to: 1890, short: { en: "William III", fr: "Guillaume III", lb: "Wëllem III." }, name: { en: "Grand Duke William III", fr: "Grand-duc Guillaume III", lb: "Groussherzog Wëllem III." } },
        { from: 1890, to: 1905, short: { en: "Adolphe", fr: "Adolphe", lb: "Adolphe" }, name: { en: "Grand Duke Adolphe", fr: "Grand-duc Adolphe", lb: "Groussherzog Adolphe" } },
        { from: 1905, to: 1912, short: { en: "W. IV", fr: "G. IV", lb: "W. IV" }, name: { en: "Grand Duke William IV", fr: "Grand-duc Guillaume IV", lb: "Groussherzog Wëllem IV." } },
        { from: 1912, to: 1919, short: { en: "M.-A.", fr: "M.-A.", lb: "M.-A." }, name: { en: "Grand Duchess Marie-Adélaïde", fr: "Grande-duchesse Marie-Adélaïde", lb: "Groussherzogin Marie-Adélaïde" } },
        { from: 1919, to: 1964, short: { en: "Charlotte", fr: "Charlotte", lb: "Charlotte" }, name: { en: "Grand Duchess Charlotte", fr: "Grande-duchesse Charlotte", lb: "Groussherzogin Charlotte" } },
        { from: 1964, to: 2000, short: { en: "Jean", fr: "Jean", lb: "Jean" }, name: { en: "Grand Duke Jean", fr: "Grand-duc Jean", lb: "Groussherzog Jean" } },
        { from: 2000, to: 2025, short: { en: "Henri", fr: "Henri", lb: "Henri" }, name: { en: "Grand Duke Henri", fr: "Grand-duc Henri", lb: "Groussherzog Henri" } },
        { from: 2025, to: 2026, short: { en: "Guill.", fr: "Guill.", lb: "Guill." }, name: { en: "Grand Duke Guillaume", fr: "Grand-duc Guillaume", lb: "Groussherzog Guillaume" } },
    ],

    intro: {
        title: {
            en: "A thousand years in one map",
            fr: "Mille ans sur une seule carte",
            lb: "Dausend Joer op enger Kaart",
        },
        text: {
            en: "Luxembourg grew from a castle on a rock into a fortress, a capital and a European city. Every building standing today is here, coloured by the year it was built. Follow the story to see which ruler the city belonged to when each part was built.",
            fr: "Luxembourg est passée d'un château sur un rocher à une forteresse, une capitale et une ville européenne. Chaque bâtiment encore debout figure ici, coloré selon son année de construction. Suivez l'histoire pour voir à quel souverain la ville appartenait quand chaque quartier s'est construit.",
            lb: "Lëtzebuerg ass vun enger Buerg op engem Fiels zu enger Festung, enger Haaptstad an enger europäescher Stad ginn. All Gebai, dat haut nach steet, ass hei, a sengem Baujoer no gefierft. Verfollegt d'Geschicht a gesitt, wiem d'Stad gehéiert huet, wéi déi eenzel Deeler gebaut gi sinn.",
        },
        view: { longitude: 6.1300, latitude: 49.6070, zoom: 13.4, pitch: 52, bearing: -18 },
    },

    chapters: [
        {
            year: 963,
            title: { en: "A castle on a rock", fr: "Un château sur un rocher", lb: "Eng Buerg op engem Fiels" },
            text: {
                en: "Count Siegfried trades land with the Abbey of St Maximin in Trier for a small fort on the Bock, a rocky spur above the Alzette. Its name, Lucilinburhuc, “little castle”, becomes Luxembourg. Nothing of that castle stands: what you can still see on the Bock are the later casemates cut into the rock.",
                fr: "Le comte Sigefroid échange des terres avec l'abbaye Saint-Maximin de Trèves contre un petit fort sur le Bock, un éperon rocheux au-dessus de l'Alzette. Son nom, Lucilinburhuc, « petit château », deviendra Luxembourg. De ce château, il ne reste rien : ce que l'on voit encore sur le Bock, ce sont les casemates creusées plus tard dans le rocher.",
                lb: "De Grof Siegfried tauscht Land mat der Abtei Sankt Maximin vun Tréier géint e klenge Fort um Bock, e Fielsvirsprong iwwer der Uelzecht. Säin Numm, Lucilinburhuc, „kleng Buerg“, gëtt Lëtzebuerg. Vun där Buerg steet näischt méi: wat een um Bock nach gesäit, sinn d'Kasematten, déi méi spéit an de Fiels gehaue goufen.",
            },
            view: { longitude: 6.1372, latitude: 49.6116, zoom: 16.2, pitch: 55, bearing: -30 },
        },
        {
            year: 1244,
            title: { en: "A charter for the town", fr: "Une charte pour la ville", lb: "E Fräiheetsbréif fir d'Stad" },
            text: {
                en: "Countess Ermesinde, who ruled for half a century, grants the townspeople a charter of freedoms. The settlement around the castle and the market grows into a walled town on the plateau that is today's Ville-Haute.",
                fr: "La comtesse Ermesinde, qui a régné un demi-siècle, accorde aux habitants une charte d'affranchissement. Le bourg autour du château et du marché devient une ville fortifiée sur le plateau qui est aujourd'hui la Ville-Haute.",
                lb: "D'Gräfin Ermesinde, déi en halleft Joerhonnert regéiert huet, gëtt de Stadbewunner e Fräiheetsbréif. D'Siidlung ronderëm d'Buerg an de Maart gëtt eng ummauert Stad um Plateau vun der haiteger Uewerstad.",
            },
            view: { longitude: 6.1305, latitude: 49.6110, zoom: 15.4, pitch: 50, bearing: -15 },
        },
        {
            year: 1308,
            title: { en: "A family of emperors", fr: "Une famille d'empereurs", lb: "Eng Famill vu Keeseren" },
            text: {
                en: "Count Henry VII is elected King of the Romans and later crowned Holy Roman Emperor. His son John the Blind, his grandson Charles IV and his great-grandsons make the House of Luxembourg one of Europe's great dynasties. In 1354 Charles IV raises the county to a duchy. The rulers now live in Prague, and the town stays a fortified provincial seat.",
                fr: "Le comte Henri VII est élu roi des Romains, puis couronné empereur du Saint-Empire. Son fils Jean l'Aveugle, son petit-fils Charles IV et ses arrière-petits-fils font de la maison de Luxembourg l'une des grandes dynasties d'Europe. En 1354, Charles IV élève le comté au rang de duché. Les souverains vivent désormais à Prague, et la ville reste un chef-lieu fortifié de province.",
                lb: "De Grof Heinrich VII. gëtt zum réimesche Kinnek gewielt a spéider zum Keeser vum Hellege Réimesche Räich gekréint. Säi Jong Jang de Blannen, säin Enkel Karl IV. a seng Urenkele maachen aus dem Haus Lëtzebuerg eng vun de groussen Dynastien an Europa. 1354 mécht de Karl IV. aus der Grofschaft en Herzogtum. D'Herrscher wunnen elo zu Prag, an d'Stad bleift e befestegte Provënzsëtz.",
            },
            view: { longitude: 6.1305, latitude: 49.6110, zoom: 15, pitch: 50, bearing: -15 },
        },
        {
            year: 1443,
            title: { en: "Burgundy takes the city by night", fr: "La Bourgogne prend la ville de nuit", lb: "Burgund hëlt d'Stad an der Nuecht" },
            text: {
                en: "Troops of Philip the Good, Duke of Burgundy, scale the walls and take the city. For the next four centuries Luxembourg is a province ruled from elsewhere: by Burgundy, then the Habsburgs, then Spain. Each owner strengthens the fortress, and in 1644 the Spanish dig the first casemates.",
                fr: "Les troupes de Philippe le Bon, duc de Bourgogne, escaladent les remparts et prennent la ville. Pendant quatre siècles, Luxembourg sera une province gouvernée de l'extérieur : par la Bourgogne, puis les Habsbourg, puis l'Espagne. Chaque maître renforce la forteresse, et en 1644 les Espagnols creusent les premières casemates.",
                lb: "D'Truppe vum Philipp dem Gudden, Herzog vu Burgund, klammen iwwer d'Mauere an huelen d'Stad an. Véier Joerhonnerte laang ass Lëtzebuerg eng Provënz, déi vu soss enzwousch regéiert gëtt: vu Burgund, dann vun den Habsburger, dann vu Spuenien. All neien Här baut d'Festung weider aus, an 1644 grouwen d'Spuenier déi éischt Kasematten.",
            },
            view: { longitude: 6.1355, latitude: 49.6105, zoom: 15.6, pitch: 55, bearing: -25 },
        },
        {
            year: 1684,
            title: { en: "Vauban's fortress", fr: "La forteresse de Vauban", lb: "D'Festung vum Vauban" },
            text: {
                en: "Louis XIV takes the city after a siege, and his engineer Vauban rebuilds the defences on a vast scale, with barracks in the valleys of Grund and Pfaffenthal. The fortress earns the name “Gibraltar of the North”. The Benedictines rebuild Neumünster Abbey in the Grund from 1688. The oldest buildings still standing in the lower town date from these centuries.",
                fr: "Louis XIV prend la ville après un siège, et son ingénieur Vauban reconstruit les défenses à grande échelle, avec des casernes dans les vallées du Grund et du Pfaffenthal. La forteresse gagne le surnom de « Gibraltar du Nord ». Les bénédictins reconstruisent l'abbaye de Neumünster au Grund à partir de 1688. Les plus vieux bâtiments encore debout dans la ville basse datent de ces siècles.",
                lb: "De Louis XIV. hëlt d'Stad no enger Belagerung an, a säin Ingenieur Vauban baut d'Verdeedegung am grousse Stil nei op, mat Kasären an den Däler vum Gronn a vu Pafendall. D'Festung kritt den Numm „Gibraltar vum Norden“. D'Benediktiner bauen d'Abtei Neimënster am Gronn vun 1688 un nei. Déi eelst Gebaier, déi an der Ënnerstad nach stinn, sinn aus dëse Joerhonnerten.",
            },
            view: { longitude: 6.1365, latitude: 49.6090, zoom: 15.8, pitch: 58, bearing: 10 },
        },
        {
            year: 1714,
            title: { en: "Austrian casemates", fr: "Les casemates autrichiennes", lb: "Éisträichesch Kasematten" },
            text: {
                en: "Under the Austrian Habsburgs, Charles VI and then Maria Theresa, the fortress keeps growing. Fort Thüngen goes up on the Kirchberg side in 1732, and the casemates reach some 23 km of tunnels under the city.",
                fr: "Sous les Habsbourg d'Autriche, Charles VI puis Marie-Thérèse, la forteresse continue de grandir. Le fort Thüngen s'élève côté Kirchberg en 1732, et les casemates atteignent quelque 23 km de galeries sous la ville.",
                lb: "Ënner den éisträicheschen Habsburger, dem Karl VI. an duerno der Maria Theresia, wiisst d'Festung weider. De Fort Thüngen gëtt 1732 op der Kierchbierger Säit gebaut, an d'Kasematte kommen op ronn 23 km Gäng ënner der Stad.",
            },
            view: { longitude: 6.1389, latitude: 49.6160, zoom: 16, pitch: 55, bearing: -40 },
        },
        {
            year: 1795,
            title: { en: "Siege and revolution", fr: "Siège et révolution", lb: "Belagerung a Revolutioun" },
            text: {
                en: "After a blockade of seven months, the Austrian garrison surrenders to the armies of the French Republic. Luxembourg becomes the Département des Forêts, then part of Napoleon's empire.",
                fr: "Après un blocus de sept mois, la garnison autrichienne capitule devant les armées de la République française. Luxembourg devient le département des Forêts, puis une partie de l'empire de Napoléon.",
                lb: "No enger Blockade vu siwe Méint gëtt sech déi éisträichesch Garnisoun den Arméie vun der Franséischer Republik op. Lëtzebuerg gëtt de Departement vun de Bëscher (Département des Forêts), duerno en Deel vum Napoleon sengem Räich.",
            },
            view: { longitude: 6.1310, latitude: 49.6105, zoom: 14.8, pitch: 50, bearing: -15 },
        },
        {
            year: 1815,
            title: { en: "A grand duchy and a federal fortress", fr: "Un grand-duché et une forteresse fédérale", lb: "E Groussherzogtum an eng Bundesfestung" },
            text: {
                en: "The Congress of Vienna makes Luxembourg a grand duchy, in personal union with the Netherlands: King William I is its Grand Duke. The fortress is garrisoned by Prussian troops of the German Confederation. In 1839 the western, French-speaking part goes to Belgium. Hemmed in by its walls, the town can only grow upwards and denser.",
                fr: "Le congrès de Vienne fait de Luxembourg un grand-duché, en union personnelle avec les Pays-Bas : le roi Guillaume Ier en est le grand-duc. La forteresse est tenue par une garnison prussienne de la Confédération germanique. En 1839, la partie occidentale, francophone, revient à la Belgique. Enserrée dans ses murs, la ville ne peut que monter et se densifier.",
                lb: "De Wiener Kongress mécht aus Lëtzebuerg e Groussherzogtum, a Personalunioun mat Holland: de Kinnek Wëllem I. ass säi Groussherzog. An der Festung leien preisesch Truppe vum Däitsche Bond. 1839 geet de westlechen, franséischsproochegen Deel u Belsch. Agespaart an hire Mauere kann d'Stad just nach an d'Héicht an an d'Dicht wuessen.",
            },
            view: { longitude: 6.1320, latitude: 49.6100, zoom: 15, pitch: 50, bearing: -15 },
        },
        {
            year: 1859,
            title: { en: "The railway arrives", fr: "L'arrivée du chemin de fer", lb: "D'Eisebunn kënnt" },
            text: {
                en: "The first station opens on the Bourbon plateau, south of the Pétrusse and outside the walls, as the fortress forbids building closer. The Gare quarter grows around the tracks. The station building you see today dates from 1907–1913.",
                fr: "La première gare ouvre sur le plateau Bourbon, au sud de la Pétrusse et hors des murs, car la forteresse interdit de bâtir plus près. Le quartier de la Gare pousse autour des voies. Le bâtiment de la gare que l'on voit aujourd'hui date de 1907–1913.",
                lb: "Déi éischt Gare mécht um Plateau Bourbon op, südlech vun der Péitruss a baussent de Mauere, well d'Festung verbitt, méi no ze bauen. D'Garer Quartier wiisst ronderëm d'Schinnen. D'Garegebai, wat een haut gesäit, ass vun 1907–1913.",
            },
            view: { longitude: 6.1335, latitude: 49.6010, zoom: 15.2, pitch: 55, bearing: -10 },
        },
        {
            year: 1867,
            title: { en: "The walls come down", fr: "Les remparts tombent", lb: "D'Mauere falen" },
            text: {
                en: "The Treaty of London declares Luxembourg neutral and orders the fortress dismantled. The Prussians leave, and demolition runs until 1883. The city finally spills out: boulevards replace the bastions, part of the old defences becomes the Municipal Park, and new quarters rise in Limpertsberg and around the station.",
                fr: "Le traité de Londres déclare le Luxembourg neutre et ordonne le démantèlement de la forteresse. Les Prussiens partent, et la démolition dure jusqu'en 1883. La ville déborde enfin : des boulevards remplacent les bastions, une partie des anciennes défenses devient le parc municipal, et de nouveaux quartiers s'élèvent au Limpertsberg et autour de la gare.",
                lb: "De Londoner Vertrag erkläert Lëtzebuerg neutral a bestëmmt, datt d'Festung ofgerappt gëtt. D'Preise ginn, an den Ofrappen dauert bis 1883. Endlech wiisst d'Stad iwwer hir Grenzen: Boulevarden ersetzen d'Bastiounen, en Deel vun den ale Befestegunge gëtt de Stadpark, an nei Quartiere wuessen um Lampertsbierg a ronderëm d'Gare.",
            },
            view: { longitude: 6.1250, latitude: 49.6140, zoom: 14.6, pitch: 50, bearing: -20 },
        },
        {
            year: 1890,
            title: { en: "A dynasty of its own", fr: "Une dynastie à soi", lb: "Eng eegen Dynastie" },
            text: {
                en: "William III dies without a male heir, and the personal union with the Netherlands ends. Adolphe of Nassau-Weilburg becomes Grand Duke; his house still reigns. The Belle Époque city takes shape: the Adolphe Bridge (1900–1903), for a time the largest stone arch in the world, links the old town to the station quarter.",
                fr: "Guillaume III meurt sans héritier mâle, et l'union personnelle avec les Pays-Bas prend fin. Adolphe de Nassau-Weilbourg devient grand-duc ; sa maison règne toujours. La ville Belle Époque prend forme : le pont Adolphe (1900–1903), un temps la plus grande arche en pierre du monde, relie la vieille ville au quartier de la Gare.",
                lb: "De Wëllem III. stierft ouni männlechen Ierwen, an d'Personalunioun mat Holland geet op en Enn. Den Adolphe vun Nassau-Weilburg gëtt Groussherzog; säin Haus regéiert nach ëmmer. D'Stad vun der Belle Époque hëlt Form un: d'Adolphe-Bréck (1900–1903), eng Zäit laang dee gréisste Steebou vun der Welt, verbënnt d'Alstad mam Garer Quartier.",
            },
            view: { longitude: 6.1268, latitude: 49.6075, zoom: 15.6, pitch: 55, bearing: -60 },
        },
        {
            year: 1919,
            title: { en: "Charlotte's long reign", fr: "Le long règne de Charlotte", lb: "Dem Charlotte seng laang Regentschaft" },
            text: {
                en: "Marie-Adélaïde abdicates and her sister Charlotte succeeds her; a referendum the same year keeps the monarchy. Between the wars terraces and villas fill Belair, Bonnevoie and Hollerich. From 1940 to 1944 the country is occupied by Germany while Charlotte speaks to it from exile in London.",
                fr: "Marie-Adélaïde abdique et sa sœur Charlotte lui succède ; un référendum la même année maintient la monarchie. Entre les deux guerres, maisons en bande et villas remplissent Belair, Bonnevoie et Hollerich. De 1940 à 1944, le pays est occupé par l'Allemagne, tandis que Charlotte lui parle depuis son exil à Londres.",
                lb: "D'Marie-Adélaïde dankt of an hir Schwëster Charlotte kënnt no hir; e Referendum am selwechte Joer hält d'Monarchie. Tëschent de Kricher fëllen Reienhaiser a Villaen Belair, Bouneweg an Hollerech. Vun 1940 bis 1944 ass d'Land vun Däitschland besat, während d'Charlotte aus dem Exil zu London zu de Lëtzebuerger schwätzt.",
            },
            view: { longitude: 6.1150, latitude: 49.6090, zoom: 14.6, pitch: 50, bearing: -10 },
        },
        {
            year: 1952,
            title: { en: "A capital of Europe", fr: "Une capitale de l'Europe", lb: "Eng Haaptstad vun Europa" },
            text: {
                en: "The High Authority of the European Coal and Steel Community settles in Luxembourg. From 1961 the state develops the empty Kirchberg plateau for the European institutions; the Red Bridge reaches it in 1966. Jean becomes Grand Duke in 1964.",
                fr: "La Haute Autorité de la Communauté européenne du charbon et de l'acier s'installe à Luxembourg. À partir de 1961, l'État aménage le plateau vide du Kirchberg pour les institutions européennes ; le pont Rouge le rejoint en 1966. Jean devient grand-duc en 1964.",
                lb: "D'Héich Autoritéit vun der Europäescher Gemeinschaft fir Kuel a Stol léisst sech zu Lëtzebuerg nidder. Vun 1961 un erschléisst de Staat den eidele Kierchbierger Plateau fir d'europäesch Institutiounen; déi Rout Bréck verbënnt en 1966 mat der Stad. De Jean gëtt 1964 Groussherzog.",
            },
            view: { longitude: 6.1520, latitude: 49.6230, zoom: 14.6, pitch: 55, bearing: -30 },
        },
        {
            year: 1971,
            title: { en: "The financial centre", fr: "La place financière", lb: "D'Finanzplaz" },
            text: {
                en: "Banks and funds multiply and office blocks rise along the boulevards, the route d'Arlon and on Kirchberg. In 1994 UNESCO lists the old quarters and fortifications as World Heritage.",
                fr: "Banques et fonds se multiplient, et les immeubles de bureaux s'élèvent le long des boulevards, de la route d'Arlon et au Kirchberg. En 1994, l'UNESCO inscrit les vieux quartiers et les fortifications au patrimoine mondial.",
                lb: "Banken a Fonge gi ëmmer méi, a Bürosgebaier wuessen laanscht d'Boulevarden, d'Arelerstrooss an um Kierchbierg. 1994 setzt d'UNESCO déi al Quartieren an d'Festungswierker op d'Lëscht vum Weltierfgutt.",
            },
            view: { longitude: 6.1350, latitude: 49.6150, zoom: 14, pitch: 50, bearing: -20 },
        },
        {
            year: 2000,
            title: { en: "Henri and the new skyline", fr: "Henri et la nouvelle silhouette", lb: "Den Henri an déi nei Skyline" },
            text: {
                en: "Henri becomes Grand Duke. Kirchberg gains the Philharmonie (2005), Mudam (2006) and the twin towers of the Court of Justice (2008); Cloche d'Or grows in the south, and the tram returns in 2017. Most of the bright pink buildings on the map are from these years.",
                fr: "Henri devient grand-duc. Le Kirchberg accueille la Philharmonie (2005), le Mudam (2006) et les tours jumelles de la Cour de justice (2008) ; la Cloche d'Or pousse au sud, et le tram revient en 2017. La plupart des bâtiments rose vif de la carte datent de ces années.",
                lb: "Den Henri gëtt Groussherzog. De Kierchbierg kritt d'Philharmonie (2005), de Mudam (2006) an d'Zwillingstierm vum Geriichtshaff (2008); am Süde wiisst d'Cloche d'Or, an 2017 kënnt den Tram zeréck. Déi meescht hellrosa Gebaier op der Kaart sinn aus dëse Joren.",
            },
            view: { longitude: 6.1450, latitude: 49.6100, zoom: 13.6, pitch: 50, bearing: -20 },
        },
        {
            year: 2025,
            title: { en: "Guillaume", fr: "Guillaume", lb: "De Guillaume" },
            text: {
                en: "On 3 October 2025 Henri abdicates and his son becomes Grand Duke Guillaume. Every building on this map is still standing: what was torn down, from Vauban's bastions to whole old streets, is missing, so the past always looks emptier than it was.",
                fr: "Le 3 octobre 2025, Henri abdique et son fils devient le grand-duc Guillaume. Chaque bâtiment de cette carte est encore debout : ce qui a été démoli, des bastions de Vauban à des rues entières, manque, et le passé paraît donc toujours plus vide qu'il ne l'était.",
                lb: "Den 3. Oktober 2025 dankt den Henri of a säi Jong gëtt Groussherzog Guillaume. All Gebai op dëser Kaart steet nach: wat ofgerappt gouf, vun de Bastioune vum Vauban bis zu ganzen ale Stroossen, feelt, an dofir gesäit d'Vergaangenheet ëmmer méi eidel aus, wéi se war.",
            },
            view: { longitude: 6.1300, latitude: 49.6070, zoom: 13.4, pitch: 52, bearing: -18 },
        },
    ],
};
