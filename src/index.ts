import { AnySpec } from "./specs/AnySpec";
import { MyReact } from "./MyReact";
import { VNodeFactory } from "./nodes/NodeFactory";
import { SpecFactory } from "./specs/SpecFactory";

// 실제로 사용하는 API는 createReactInstance#render() 뿐이다.
export const createReactInstance = () => {
    const vNodeFactory = new VNodeFactory();
    return new MyReact(vNodeFactory);
};

const factory = new SpecFactory();

// JSX 사용에 필요한 namespace 선언
// ts(7026)
declare global {
    namespace JSX {
        interface IntrinsicElements {
            [propName: string]: any;
        }
    }

    function createSpec(...args: any[]): AnySpec | null;
}

// createSpec은 JSX 변환 후 전역에 노출되어 있어야 한다.
globalThis.createSpec = factory.createSpec.bind(factory);
