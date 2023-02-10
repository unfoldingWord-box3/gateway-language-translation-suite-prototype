import React from "react";
import { doesReferenceContain } from "bible-reference-range";
import { ReferenceFilters } from "./ReferenceFilters";

const doCleanRef = (dirtyRef) => dirtyRef.split("\t").find(ref => /[\w\d]+:[\w\d]+/.test(ref))
const sortRefs =  (a, b) => {
  if(isNaN(a) || isNaN(b)) return -1;
  const x = parseInt(a);
  const y = parseInt(b);
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

export const getReferenceFilterOptions = ({fullWidth}) => (
  {
    filterType: "custom",
    customFilterListOptions: {
      render: (filters) => filters.map((f) => `Reference: ${f.split("|")[1]}`),
      update: (filterList, filterPos, index) => {
        filterList[index].splice(filterPos, 1);
        return filterList;
      }
    },
    filterOptions: {
      logic: (location, filters) => {
        try {
          const references = filters.map((filter) => filter.split("|")[1]);
          const cleanLocation = doCleanRef(location);
          const baseReference = references.join(";")
          if (filters.length && cleanLocation) {
            return !doesReferenceContain(baseReference, cleanLocation);
          };
          return false;
        } catch (error) {
          console.log({location, filters})
          throw(error);
        }
      },
      display: (filterList, onChange, index, column, columns) => {
        const cvObject = columns[index].reduce((cvObject, ref) => {
          const cleanRef = doCleanRef(ref);
          if (!cleanRef) return cvObject;
          const [chapter, verse] = cleanRef.split(":")
          if (!cvObject[chapter]) cvObject[chapter] = new Set();
          cvObject[chapter].add(verse);
          return cvObject;
        },{});

        const values = Object.keys(cvObject).sort(sortRefs).reduce((refs, key) => {
          const sorted = [...cvObject[key]].sort(sortRefs);
          sorted.forEach(v => {
            refs.raw.push(`${key}:${v}`)
          })
          refs.cv.set(key,sorted);
          return refs
        },{raw: [], cv: new Map()})

        return (
        <ReferenceFilters
          {...{ filterList, onChange, index, column, values }}
        />
      )},
      fullWidth
    }
  }
)
