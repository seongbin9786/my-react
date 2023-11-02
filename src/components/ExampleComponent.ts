import { AnySpec } from "../specs/AnySpec";
import { Component } from "./Component";

// 이 정도는 쓸 수 있게 해줘야겠는데요..?
// default는 object인데 그렇게 하면 property가 없으니..
// generic으로 State를 받게 하는 게 좋을 듯: Component<MyState, MyProps>
// interface State {
//     time?: Date;
//     count?: number;
// }

export class Timer extends Component {
    // instance property로 정의하게 된다.
    // 어떻게 React는 이렇게 state를 초기화할 수 있게 했을까?
    // state: State = {};

    constructor() {
        super(); // why?
        // ES6 Derived Class는 constructor에서 super를 필수로 호출해야 함.
        // https://stackoverflow.com/questions/31067368/how-to-extend-a-class-without-having-to-use-super-in-es6

        // 아 이거 state를 지정할 수가 없는데..?
        // 흠... 애매하네... 어떻게 해야 했을까?
        // 다행히도 this.로 super의 state accessor를 접근할 수 있음 (prototype chain)
        this.state = {
            time: new Date(),
            count: 0,
        };
    }

    render(): AnySpec | null {
        return null;
    }
}
