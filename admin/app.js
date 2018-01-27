var app = new Vue({
    el: '#app',
    data: {
        words: [],
        count: 0,
        page: 0,
        limit: 10,
        sort: "word",
        order: "asc",
        api: "http://localhost:3000",
    },
    computed: {
        pages() {
            return Math.ceil(this.count / this.limit)
        }
    },
    methods: {
        init() {
            this.getWordCount()
                .then(response => {
                    this.count = response.data.count
                    this.getWordList()
                })
        },
        getWordCount() {
            return axios.get(this.api + "/count")
        },
        getWordList() {
            axios.get(`${this.api}/fetch?limit=${this.limit}&offset=${(this.limit*this.page)}&sort=${this.sort}&order=${this.order}`)
                .then(response => {
                    this.words = response.data
                })
        },
        goTo(page) {
            this.page = page - 1
            this.getWordList()
        },
        save(word) {
            if (word.id) {
                return this.update(word)
            }
            
            this.store(word)
        },
        store(word) {
            word.isLoading = true
            axios.post(`${this.api}/store`, word)
                .then(response => {
                    word.id = response.data.id
                    word.isLoading = false
                })
        },
        update(word) {
            axios.put(`${this.api}/update?id=${word.id}`, word)
                .then(response => {
                    word.isLoading = false
                })
        },
        add(){
            this.words.push({
                word: null,
                translation: null,
                isLoading: false,
            })
        },
        remove(word){
            if(confirm("Are you sure?")) {
                axios.get(`${this.api}/delete?id=${word.id}`)
                .then(response => {
                    this.getWordList()
                })
            }
        }
    },
    mounted(){
        this.init()
    }
})