// 트랜스파일된 JSX와 컴포넌트를 해당 스크립트 내에 정의
import { createReactInstance } from "@src/index.js";

const containerElement = document.getElementById("root");

if (!containerElement) {
    throw new Error("root Element가 존재하지 않아 렌더링할 수 없습니다.");
}

const element = (
    <div>
        <header>
            <button className="gnb gnb_l" id="loginBtn">
                로그인
            </button>
            <button className="gnb gnb_r" id="theaterBtn">
                좌석예매
            </button>
        </header>
        <main>
            <div className="section section-login" id="loginSection">
                <div className="content">
                    <header>
                        <div>Login Form</div>
                    </header>
                    <section>
                        <div className="input-group">
                            <input type="email" placeholder="이메일을 입력해주세요." id="email" />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="비밀번호를 입력해주세요."
                                id="password"
                            />
                        </div>
                        <div className="input-group">
                            <button id="theaterLoginBtn">Login</button>
                        </div>
                    </section>
                </div>
            </div>
            <div className="section section-theater" id="theaterSection">
                <div className="col-head" id="theaterSectionHead">
                    인원/좌석
                </div>
                <div className="col-body">
                    <div className="info">
                        <div className="section section-numOfPeople">
                            <div className="row" id="numOfPeopleNotice">
                                <span>* 최대 8명 선택 가능</span>
                            </div>
                            <div className="row">
                                <span className="label">어른</span>
                                <div className="btn-group" id="adultBtn">
                                    <button className="btn --general">0</button>
                                    <button className="btn --general">1</button>
                                    <button className="btn --general">2</button>
                                    <button className="btn --general">3</button>
                                    <button className="btn --general">4</button>
                                    <button className="btn --general">5</button>
                                    <button className="btn --general">6</button>
                                    <button className="btn --general">7</button>
                                    <button className="btn --general">8</button>
                                </div>
                            </div>
                            <div className="row">
                                <span className="label">어린이/청소년</span>
                                <div className="btn-group" id="youthBtn">
                                    <button className="btn --youth">0</button>
                                    <button className="btn --youth">1</button>
                                    <button className="btn --youth">2</button>
                                    <button className="btn --youth">3</button>
                                    <button className="btn --youth">4</button>
                                    <button className="btn --youth">5</button>
                                    <button className="btn --youth">6</button>
                                    <button className="btn --youth">7</button>
                                    <button className="btn --youth">8</button>
                                </div>
                                <div className="checkbox">
                                    <input
                                        id="checkHandicap"
                                        type="checkbox"
                                        name="handicap"
                                        value="handicap"
                                    />
                                    장애인
                                </div>
                            </div>
                        </div>
                        <div className="section section-reserveInfo" id="reserveInfo">
                            <div className="row">
                                <div className="reserve-info">
                                    그렙 씨네마 | 머쓱관 | 잔여좌석
                                    <span id="remainSeatCnt">39</span>/39
                                </div>
                            </div>
                            <div className="row">
                                <span>2023.03.04(토) 16:30 ~ 19:11</span>
                            </div>
                            <div className="row">
                                총 금액&nbsp;&nbsp;<span id="amount">0</span>원
                            </div>
                        </div>
                    </div>
                    <div className="theater">
                        <div className="section section-seat">
                            <div id="screenArea">Screen</div>
                            <div className="seat-group">
                                <div id="seatRow">
                                    <span>A</span>
                                    <span>B</span>
                                    <span>C</span>
                                </div>
                                <div id="theaterSeat"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-footer">
                    <button id="reselect">좌석 선택 초기화</button>
                </div>
            </div>
        </main>
    </div>
);

console.log("element:", element);

const react = createReactInstance();
react.render(element, containerElement);
