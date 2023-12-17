const isEmpty = (params) => {
    return params === null || params === undefined
}

const getList = async (database) => {
    const result = await database.all('SELECT * FROM todo where state != 2')
    console.log("result", result)
    return result
}

const addTask = async (database, { text, state }) => {
    if (!text || !state) {
        return { err: '参数不能为空', data: '' }
    }
    try {
        const data = await database.run("INSERT INTO todo(text, state) VALUES(?, ?)", text, state)
        return { err: '', data}
    } catch (e) {
        return { err: e }
    }
}

const updateTask = async (database, { id, state }) => {
    if ( isEmpty(id) || isEmpty(state) ) {
        return { err: '参数不能为空', data: '' }
    }
    try {
        const data = await database.run("UPDATE todo SET state = ? where id = ?", state, id)
        return { err: '', data}
    } catch (e) {
        return { err: e }
    }
}

module.exports = {
    getList,
    addTask,
    updateTask
}