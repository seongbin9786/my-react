import { Component, ConcreteComponent } from "../components/Component";
import { TEXT_ELEMENT } from "../shared/constants";
import { AnySpec } from "./AnySpec";
import { ComponentSpec } from "./ComponentSpec";
import { HTMLSpec } from "./HTMLSpec";

export class SpecFactory {
    createSpec(...args: any[]): AnySpec | null {
        console.log(`VNodeFactory.createSpec[argsLength: ${args.length}]:`, ...args);

        // 1. 정상 JSX
        if (this.isJSX(args)) {
            console.log("crateSpec: 정상 JSX입니다.", args);
            const [type, props, ...childrenValues] = args;
            const childSpecs = this.filterChildSpecs(childrenValues);

            // 1-1. Component인 경우
            if (type instanceof Component) {
                // abstrac class인 Component의 instanceof를 사용할 수 없다.
                // FIXME: as를 쓰지 않는 방법 생각해보기.
                return new ComponentSpec(type as ConcreteComponent, props, childSpecs);
            }

            // 1-2. HTML인 경우
            return new HTMLSpec(type, props || {}, childSpecs);
        }

        // 2. 표현식 결과인 단일 값은 Text Node로 표현하므로 Text Spec으로 생성한다.
        console.log("crateSpec: 단순 값입니다.", args);
        return this.createTextSpec(args[0]);
    }

    private isJSX(args: any[]) {
        const [type, props] = args;

        // children은 없을 수도 있다.
        const hasMultiArguments = args.length > 1;
        const hasType = typeof type === "string" || type instanceof Component;
        const hasProps = props instanceof Object || props === null;

        console.log(`args[length=${args.length}]: ${JSON.stringify(args)}
        hasMultiArguments: ${hasMultiArguments}
        hasType: ${hasType}
        hasProps: ${hasProps}`);

        return hasMultiArguments && hasType && hasProps;
    }

    private filterChildSpecs(children: any[]) {
        console.log(`[SpecFactory] [filterChildSpecs] children:`, children);

        return children
            .map((child) => (child instanceof AnySpec ? child : this.createTextSpec(child)))
            .filter((child) => child !== null) as AnySpec[];
    }

    private createTextSpec(specOrValue: any): AnySpec | null {
        // 1. 문자열, 숫자 --> 텍스트 노드로 표현
        const renderableType = typeof specOrValue === "string" || typeof specOrValue === "number";
        if (renderableType) {
            const textContent = specOrValue.toString();
            const props = { nodeValue: textContent };
            return new HTMLSpec(TEXT_ELEMENT, props, []);
        }

        // 2. 그 외 값
        // 배열, 객체    표현할 수 없는 값
        // null         렌더링하지 않는다는 뜻
        // false        && 으로 체크했을 때 렌더링 안되는 경우.
        return null;
    }
}
