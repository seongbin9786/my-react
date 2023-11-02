// 직접 구현하므로 interface 보단 abstract class로 두는 게 좋겠다.
import { AnySpec } from "../specs/AnySpec";

// 트랜스파일되면 빈 class가 된다.
export abstract class VNode {
    // 본인/부모로부터 온 첫 render 요청
    abstract newRender(): void;

    // 부모로부터 온 re-render 요청
    abstract reRender(newDomSpec: AnySpec | null): void;

    // 부모로부터 온 제거 요청
    abstract removeSelf(): void;
}
