import { Component } from "../components/Component";

export abstract class AnySpec {
    // Component, HTML 스펙의 차이는 type과 children이다.
    abstract get type(): string | Component;
    abstract get props(): object | null;
    abstract get children(): AnySpec[];
}
