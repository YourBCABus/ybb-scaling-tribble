import createNewClient from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetBus } from "./__generated__/GetBus";
import { GetPerms } from "./__generated__/GetPerms";

import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { Props } from "../../lib/utils";
import { MouseEvent } from "react";

import styles from "../../styles/Bus.module.scss";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

import Head from 'next/head';
import BusComponent, { BusComponentSizes } from "../../lib/busComponent";
import NavBar, { PagesInNavbar } from "../../lib/navbar";

import permParseFunc from "../../lib/perms";
import { saveBoardingAreaCallback, saveBusCallback } from "../../lib/editingCallbacks";

export const GET_BUS = gql`
query GetBus($id: ID!) {
    bus(id: $id) {
        available
        boardingArea
        company
        id
        invalidateTime
        name
        otherNames
        phone
        schoolID
        stops {
            id
            name
            description
            location {
                lat
                long
            }
            order
        }
        
    }
}
`;
export const GET_PERMS = gql`
query GetPerms($schoolID: ID!) {
    currentSchoolScopes(schoolID: $schoolID) 
}
`;

export default function Bus({ bus: busOrUndef, currentSchoolScopes: permsOrUndef }: Props<typeof getServerSideProps>): JSX.Element {
    const bus = Object.freeze(busOrUndef!);
    const perms = Object.freeze(permParseFunc(Object.freeze(permsOrUndef!)));

    let [editMode, setEditMode] = useState<boolean>(false);

    let [starredBusIDs, setStarredBusIDs] = useState<Set<string>>(new Set());
    useEffect(() => {
        setStarredBusIDs(new Set(JSON.parse(localStorage.getItem("starred")!) as string[]));
    }, []);
    useEffect(() => {
        localStorage.setItem("starred", JSON.stringify([...starredBusIDs]));
    }, [starredBusIDs]);

    const router = useRouter();
    const updateServerSidePropsFunction = useCallback(() => router.replace(router.asPath, undefined, {scroll: false}), [router]);
    useEffect(() => {
        const interval = setInterval(updateServerSidePropsFunction, editMode ? 2000 : 15000);
        return () => clearInterval(interval);
    }, [editMode, updateServerSidePropsFunction]);

    const starCallback = (id: string, event: MouseEvent<SVGSVGElement>): void => {
        event.stopPropagation();
        event.preventDefault();
        const starred = new Set(starredBusIDs);
        if (starred.has(id)) {
            starred.delete(id);
        } else {
            starred.add(id);
        }
        setStarredBusIDs(starred);
    };

    return <div>
        <Head>
            <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
        </Head>
        <header className={styles.header}>
            <NavBar
                selectedPage={PagesInNavbar.NONE}
                editSwitchOptions={
                    perms.bus.update
                    || perms.bus.updateStatus 
                    || perms.bus.delete
                    || perms.stop.create
                    || perms.stop.update
                    || perms.stop.delete
                        ? {state: editMode, onChange: setEditMode}
                        : undefined
                }
            />
            <br/>
            <br/>
        </header>
        <BusComponent
            bus={bus}
            starCallback={(event) => starCallback(bus.id, event)}
            isStarred={starredBusIDs.has(bus.id)}
            editing={editMode && perms}
            size={BusComponentSizes.LARGE}
            noLink={true}
            saveBoardingAreaCallback={saveBoardingAreaCallback(updateServerSidePropsFunction)(bus.id)}
            saveBusNameCallback={
                (name) => saveBusCallback(updateServerSidePropsFunction)(bus.id)(
                    {
                        name,
                        company: bus.company,
                        phone: bus.phone,
                        available: bus.available,
                        otherNames: bus.otherNames,
                    }
                )
            }
        />
        
    </div>;
}


export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {
    const client = createNewClient();

    let data: GetBus | null = null;
    let currentSchoolScopes: string[] | null = null;
    try {
        const { data: scopedData } = await client.query<GetBus>({query: GET_BUS, variables: {id: context.params!.busId}, context: {req: context.req}});
        data = scopedData;

        const {data: { currentSchoolScopes: scopedCurrentSchoolScopes }} = await client.query<GetPerms>({query: GET_PERMS, variables: {schoolID: data.bus?.schoolID}, context: {req: context.req}});
        currentSchoolScopes = scopedCurrentSchoolScopes;
    } catch (e) {
        console.log(e);
    }


    return !data?.bus || !currentSchoolScopes ? {notFound: true, props: {}} : {props: {bus: data.bus, currentSchoolScopes}};
};
