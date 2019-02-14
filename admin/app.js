Vue.component('paginate', VuejsPaginate)

const getParameterByName = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var app = new Vue({
    el: '#app',
    data: {
        words: [],
        translated: 0,
        untranslated: 0,
        total: 0,
        count: 0,
        page: parseInt(getParameterByName('page')) || 0,
        limit: getParameterByName('limit') || 10,
        searchField: getParameterByName('searchField') || "word",
        searchTerm: getParameterByName('searchTerm') || "",
        searchMode: getParameterByName('searchMode') || "equals",
        sort: getParameterByName('sort') || "word",
        order: getParameterByName('order') || "asc",
        filter: getParameterByName('filter') || "0",
        api: "http://localhost:3000",
    },
    computed: {
        pages() {
            return Math.ceil(this.count / this.limit);
        },
        offset() {
            return this.limit*(this.page-1)
        }
    },
    methods: {
        init() {
            this.getWordCount()
                .then(response => {
                    this.count = response.data.count
                    this.translated = response.data.translated
                    this.untranslated = response.data.untranslated
                    this.total = response.data.total
                    this.getWordList()
                })
        },
        getWordCount() {
            return axios.get(`${this.api}/count?filter=${this.filter}&searchTerm=${this.searchTerm}&searchMode=${this.searchMode}&searchField=${this.searchField}`)
        },
        getWordList() {
            axios.get(`${this.api}/fetch?limit=${this.limit}&offset=${this.offset}&sort=${this.sort}&order=${this.order}&filter=${this.filter}&searchTerm=${this.searchTerm}&searchMode=${this.searchMode}&searchField=${this.searchField}`)
                .then(response => {
                    this.words = response.data

                    this.updateUrl()
                })
        },
        goTo(page) {
            // this.page = page - 1
            this.page = page
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
        add(e){
            e.preventDefault();
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
        },
        reset(){
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.location.href = newurl;
        },
        updateUrl() {
            if (history.pushState) {
                const params = [
                    {'searchField': this.searchField},
                    {'searchTerm': this.searchTerm},
                    {'searchMode': this.searchMode},
                    {'page': this.page},
                    {'limit': this.limit},
                    {'sort': this.sort},
                    {'order': this.order},
                    {'filter': this.filter},
                ]
                let queryString = "";
                params.forEach(item => queryString += `&${Object.keys(item)}=${Object.values(item)}`)
                var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + queryString;
                window.history.pushState({path:newurl},'',newurl);
            }
        },
    },
    mounted(){
        this.init()
    }
});