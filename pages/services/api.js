import axios from 'axios'

const api = axios.create({
    baseURL: 'http://54.169.80.122:4000'
})

export default api