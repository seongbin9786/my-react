import { expect, test } from "vitest";
import { createReactInstance } from "../src";

test("can create react instance", () => {
    const react = createReactInstance();
    expect(react).not.toBeNull();
});

test("can render html", () => {
    // given
    const react = createReactInstance();
    const element = <div id="test"></div>;
    const rootElement = document.createElement("div");
    rootElement.id = "root";
    document.body.appendChild(rootElement);

    // when
    react.render(element, rootElement);

    // then
    const found = document.getElementById("test");
    expect(found).toBeInTheDocument();

    // 출력을 콘솔로 확인하는 방법
    console.log(document.documentElement.innerHTML);
});
