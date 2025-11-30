import { VocabDeck } from './index'

// Hardcore Vocabulary for "Hell Mode"
const HARDCORE_WORDS = [
    { term: 'ubiquitous', definition: 'có mặt ở khắp nơi', example: 'Coffee shops are ubiquitous in this city.', phonetic: '/juːˈbɪk.wɪ.təs/' },
    { term: 'ephemeral', definition: 'phù du, chóng tàn', example: 'Fashions are ephemeral, changing with every season.', phonetic: '/ɪˈfem.ər.əl/' },
    { term: 'serendipity', definition: 'sự tình cờ may mắn', example: 'Finding this book was pure serendipity.', phonetic: '/ˌser.ənˈdɪp.ə.ti/' },
    { term: 'obfuscate', definition: 'làm khó hiểu, gây hoang mang', example: 'She was criticized for using arguments that obfuscate the main issue.', phonetic: '/ˈɒb.fʌs.keɪt/' },
    { term: 'cacophony', definition: 'tạp âm, âm thanh hỗn tạp', example: 'As we entered the farmyard we were met with a cacophony of animal sounds.', phonetic: '/kəˈkɒf.ə.ni/' },
    { term: 'nefarious', definition: 'hung ác, bất chính', example: 'The company\'s CEO seems to have been involved in some nefarious practices.', phonetic: '/nəˈfeə.ri.əs/' },
    { term: 'quintessential', definition: 'tinh túy, điển hình nhất', example: 'Sheep\'s milk cheese is the quintessential Corsican cheese.', phonetic: '/ˌkwɪn.tɪˈsen.ʃəl/' },
    { term: 'idiosyncrasy', definition: 'đặc tính, khí chất riêng', example: 'One of the idiosyncrasies of this printer is that you can\'t stop it once it has started.', phonetic: '/ˌɪd.i.əˈsɪŋ.krə.si/' },
    { term: 'magnanimous', definition: 'hào hiệp, cao thượng', example: 'The team\'s manager was magnanimous in victory, and praised the losing team.', phonetic: '/mæɡˈnæn.ɪ.məs/' },
    { term: 'juxtaposition', definition: 'sự đặt cạnh nhau (để đối chiếu)', example: 'The juxtaposition of two very different cultures.', phonetic: '/ˌdʒʌk.stə.pəˈzɪʃ.ən/' },
    { term: 'surreptitious', definition: 'lén lút, gian lận', example: 'She seemed to be listening to what I was saying, but I couldn\'t help noticing her surreptitious glances at the clock.', phonetic: '/ˌsʌr.əpˈtɪʃ.əs/' },
    { term: 'ebullient', definition: 'sôi nổi, bồng bột', example: 'He was openly ebullient after the election.', phonetic: '/ɪˈbʊl.i.ənt/' },
    { term: 'paradigmatic', definition: 'thuộc mẫu mực, điển hình', example: 'Her career is paradigmatic of the changes in the role of women.', phonetic: '/ˌpær.ə.dɪɡˈmæt.ɪk/' },
    { term: 'recalcitrant', definition: 'hay cãi lại, cứng đầu', example: 'Tenants who have not paid their rent are being evited, along with other recalcitrant residents.', phonetic: '/rɪˈkæl.sɪ.trənt/' },
    { term: 'zenith', definition: 'thiên đỉnh, đỉnh cao', example: 'In the 1860s, Tolstoy was at the zenith of his achievement.', phonetic: '/ˈzen.ɪθ/' }
]

// Startup & Tech Vocabulary
const STARTUP_WORDS = [
    { term: 'bootstrap', definition: 'tự lực cánh sinh (khởi nghiệp không vốn)', example: 'We bootstrapped the company for the first two years.', phonetic: '/ˈbuːt.stræp/' },
    { term: 'pivot', definition: 'chuyển hướng kinh doanh', example: 'The company pivoted from a dating app to a social network.', phonetic: '/ˈpɪv.ət/' },
    { term: 'unicorn', definition: 'kỳ lân (startup trị giá trên 1 tỷ USD)', example: 'ByteDance is currently the world\'s most valuable unicorn.', phonetic: '/ˈjuː.nɪ.kɔːn/' },
    { term: 'disrupt', definition: 'đột phá, làm đảo lộn thị trường', example: 'Uber disrupted the traditional taxi industry.', phonetic: '/dɪsˈrʌpt/' },
    { term: 'scalability', definition: 'khả năng mở rộng', example: 'Scalability is a critical factor for any software business.', phonetic: '/ˌskeɪ.ləˈbɪl.ə.ti/' },
    { term: 'pitch deck', definition: 'bản trình bày gọi vốn', example: 'He spent all night perfecting his pitch deck for the investors.', phonetic: '/pɪtʃ dek/' },
    { term: 'MVP', definition: 'sản phẩm khả dụng tối thiểu (Minimum Viable Product)', example: 'We need to launch the MVP to get user feedback ASAP.', phonetic: '/ˌem.viːˈpiː/' },
    { term: 'traction', definition: 'đà tăng trưởng (người dùng/doanh thu)', example: 'The app is gaining traction in the Asian market.', phonetic: '/ˈtræk.ʃən/' },
    { term: 'churn rate', definition: 'tỷ lệ rời bỏ của khách hàng', example: 'High churn rate is killing our subscription model.', phonetic: '/tʃɜːn reɪt/' },
    { term: 'burn rate', definition: 'tốc độ tiêu tiền', example: 'With our current burn rate, we have 6 months of runway left.', phonetic: '/bɜːn reɪt/' }
]

export const EXTRA_DECKS: VocabDeck[] = [
    {
        name: 'Hell Mode Vocab 🔥',
        words: HARDCORE_WORDS,
        color: '#D32F2F',
        icon: '👹',
        description: 'Từ vựng siêu khó dành cho người muốn thử thách cực đại. (C2 Level)'
    },
    {
        name: 'Startup Lingo 🚀',
        words: STARTUP_WORDS,
        color: '#00BCD4',
        icon: '🦄',
        description: 'Thuật ngữ khởi nghiệp và công nghệ thông dụng.'
    }
]
