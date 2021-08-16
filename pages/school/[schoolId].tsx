import client from "../../lib/apollo-client";
import gql from "graphql-tag";
import { GetSchool, GetSchool_school_buses } from "./__generated__/GetSchool";
import { ApolloError } from "@apollo/client";

import { Props } from "../../lib/utils";
import { GetServerSidePropsContext } from "next";
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from "node:querystring";


import Head from 'next/head';
import NavBar, { PagesInNavbar } from "../../lib/navbar";

import styles from "../../styles/School.module.scss";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, MouseEventHandler, MouseEvent } from "react";

import getBoardingArea from "../../lib/boardingAreas";

export const GET_SCHOOL = gql`
query GetSchool($id: ID!) {
    school(id: $id) {
        id
        name
        location {
            lat
            long
        }
        available
        buses {
            id
            name
            boardingArea
            invalidateTime
            available
        }
    }
}
`;

function Bus({ bus: { name, available, boardingArea, invalidateTime }, starCallback, isStarred }: { bus: GetSchool_school_buses, starCallback: MouseEventHandler<SVGSVGElement>, isStarred: boolean } ): JSX.Element {
    return <div className={styles.bus_view}>
        <div className={styles.bus_name_and_status}>
            <span className={styles.bus_name}>{name}</span>
            <br/>
            <span className={styles.bus_status}>{available ? (getBoardingArea(boardingArea, invalidateTime) === "?" ? "Not on location" : "On location") : "Not running"}</span>
        </div>
        <FontAwesomeIcon icon={faStar} className={styles.bus_star_indicator} style={{color: isStarred ? "#00b0ff" : "rgba(0,0,0,.2)"}} onClick={starCallback} size={"lg"}/>
        <div className={styles.bus_boarding_area_background_div} style={getBoardingArea(boardingArea, invalidateTime) === "?" ? {} : {color: "#e8edec", backgroundColor: "#00796b"}}>{getBoardingArea(boardingArea, invalidateTime)}</div>
        
    </div>;
}

export default function School({ school: schoolOrUndef }: Props<typeof getServerSideProps>): JSX.Element {
    let school = schoolOrUndef!;

    let buses = returnSortedBuses(school.buses);

    let [starredBusses, setStarredBusses] = useState<Set<string>>(new Set());
    useEffect(() => {
        setStarredBusses(new Set(JSON.parse(localStorage.getItem("starred")!) as string[]));
    }, []);
    useEffect(() => {
        localStorage.setItem("starred", JSON.stringify([...starredBusses]));
    }, [starredBusses]);



    const router = useRouter();
    useEffect(() => {
        const interval = setInterval(() => {
            router.replace(router.asPath, undefined, {scroll: false});
        }, 15000);
        return () => clearInterval(interval);
    }, [router]);


    const starCallback = (id: string, event: MouseEvent<SVGSVGElement>): void => {
        event.stopPropagation();
        event.preventDefault();
        const starred = new Set(starredBusses);
        if (starred.has(id)) {
            starred.delete(id);
        } else {
            starred.add(id);
        }
        setStarredBusses(starred);
    };

    return (
        <div>
            <Head>
                <link rel="stylesheet" href="https://use.typekit.net/qjo5whp.css"/>
            </Head>
            <header className={styles.header}>
                <NavBar selectedPage={PagesInNavbar.HOME} />
                <h1 className={styles.school_name}>{school.name}</h1>
                <br/>
            </header>
            {
                buses.filter(bus => starredBusses.has(bus.id)).length > 0 && <div className={`${styles.bus_container_container} ${styles.bus_container_starred_container}`}>
                    <div className={styles.bus_container}>
                        {buses.filter(bus => starredBusses.has(bus.id)).map(
                            bus => 
                                <Bus bus={bus} starCallback={
                                    (event) => starCallback(bus.id, event)
                                } isStarred={starredBusses.has(bus.id)} key={bus.id} />
                        )}
                    </div>
                </div>
            }
            
            <div className={styles.bus_container_container}>
                <div className={styles.bus_container}>
                    {buses.map(
                        bus => 
                            <Bus bus={bus} starCallback={
                                (event) => starCallback(bus.id, event)
                            } isStarred={starredBusses.has(bus.id)} key={bus.id} />
                    )}
                </div>
            </div>
        </div>
    );
}


function returnSortedBuses(buses: GetSchool_school_buses[]): GetSchool_school_buses[] {
    let availableBuses:   GetSchool_school_buses[] = buses.filter((bus) =>  bus.available);
    availableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    let unavailableBuses: GetSchool_school_buses[] = buses.filter((bus) => !bus.available);
    unavailableBuses.sort((a, b) => a.name?.localeCompare(b.name!) ?? 1);
    return [...availableBuses, ...unavailableBuses];
}

export const getServerSideProps = async function<Q extends ParsedUrlQuery> (context: GetServerSidePropsContext<Q>) {
    let data: GetSchool | null = null;
    try {
        const { data: scopedData } = await client.query<GetSchool>({query: GET_SCHOOL, variables: {id: context.params!.schoolId}});
        data = scopedData;
    } catch (e) {
        if (e instanceof ApolloError) {
            e.clientErrors.map((error) => console.log(error.name));
        } else throw e;
    }
    
    return data?.school == null ? {notFound: true, props: {}} : {props: {school: data.school}};
};
