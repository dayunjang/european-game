const express = require('http');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let gameState = {
    step: 'waiting',
    currentCityIndex: 0,
    cities: [
        { id: 1, name: '런던', season: '여름', climate: '서안 해양성', hint: '영국, 빅벤, 흐린 날씨와 이슬비', answer: ['우산', '가벼운 겉옷'], options: ['우산', '가벼운 겉옷', '롱패딩', '선글라스'] },
        { id: 2, name: '아테네', season: '여름', climate: '지중해성', hint: '그리스, 파르테논 신전, 뜨거운 태양', answer: ['선글라스', '자외선 차단제'], options: ['우산', '방한모', '선글라스', '자외선 차단제'] },
        { id: 3, name: '모스크바', season: '여름', climate: '냉대', hint: '러시아, 붉은 광장', answer: ['긴팔 티셔츠', '가벼운 점퍼'], options: ['수영복', '긴팔 티셔츠', '가벼운 점퍼', '샌들'] },
        { id: 4, name: '파리', season: '겨울', climate: '서안 해양성', hint: '프랑스, 에펠탑, 겨울비와 쌀바람', answer: ['코트', '우산', '목도리'], options: ['숏패딩', '코트', '우산', '목도리', '선글라스'] },
        { id: 5, name: '리스본', season: '겨울', climate: '지중해성', hint: '포르투갈, 온화한 겨울과 강수', answer: ['가벼운 코트', '우산'], options: ['두꺼운 패딩', '가벼운 코트', '우산', '장갑'] },
        { id: 6, name: '로바니에미', season: '겨울', climate: '냉대', hint: '핀란드, 산타마을, 영하의 눈', answer: ['두꺼운 패딩', '방한모', '장갑'], options: ['선글라스', '두꺼운 패딩', '방한모', '장갑', '반팔'] }
    ],
    students: {}
};

io.on('connection', (socket) => {
    socket.on('join_game', (data) => {
        gameState.students[socket.id] = { name: data.name, score: 0 };
        io.emit('update_state', gameState);
    });

    socket.on('teacher_command', (cmdData) => {
        if (cmdData.action === 'next_step') {
            gameState.step = cmdData.step;
        } else if (cmdData.action === 'change_city') {
            gameState.currentCityIndex = cmdData.index;
            gameState.step = 'location';
        }
        io.emit('update_state', gameState);
    });

    socket.on('submit_bag', (selectedItems) => {
        const student = gameState.students[socket.id];
        if (!student) return;
        const currentCity = gameState.cities[gameState.currentCityIndex];
        const isCorrect = currentCity.answer.every(item => selectedItems.includes(item)) && selectedItems.length === currentCity.answer.length;

        if (isCorrect) {
            student.score += 10;
            socket.emit('result_feedback', { success: true, message: '정답입니다! 완벽한 여행 준비네요.' });
        } else {
            socket.emit('result_feedback', { success: false, message: '오답입니다! 기후 특성을 다시 생각해보세요.' });
        }
        io.emit('update_state', gameState);
    });

    socket.on('disconnect', () => {
        delete gameState.students[socket.id];
        io.emit('update_state', gameState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});