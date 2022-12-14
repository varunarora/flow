import ContentTypes from '../components/content-types'
import extend from "deep-extend"
import {useState, useEffect, useRef} from 'react'


export const blockStyleFn = (formatting, block) => {
    if (formatting && formatting.textAlign)
        return `textAlign-${formatting.textAlign}`
}


export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}


var uppercase = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
        'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ],
    lowercase = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
        'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    ];

export function t(term, app){
    if (app && app.stepsAlias){
        // Very very rough pluralization check that can break easily.
        var isPlural = term.substring(term.length - 1) === 's' && (
                term.substring(term.length - 2) !== 's'),
            isCamelCase = uppercase.indexOf(term.substring(0, 1)) !== -1,
            singularTerm = term;

        if (isPlural)
            singularTerm = term.substring(0, term.length - 1);

        if (singularTerm.toLowerCase() === 'step'){
            var newTerm = app.stepsAlias.substring(0, app.stepsAlias.length - 1);

            if (isPlural)
                newTerm += 's';

            if (isCamelCase)
                newTerm = uppercase[lowercase.indexOf(
                    newTerm.substring(0, 1))] + newTerm.substring(1);

            return newTerm;
        }
    }

    return term;
}


export function updateFlowProgressStateUponStepCompletion(stepID, progress, setProgress, numberOfSteps){
    setProgress({
        ...progress, completed: progress.completed + 100 / numberOfSteps,
        steps: {
            ...(progress.steps || {}),
            [stepID]: {
                ...((progress.steps && progress.steps[stepID]) || {}),
                completed: 100
            }
        }
    })
}

const {Text, Response, CheckAnswer, Image, ArrayType, Numberline, MultipleChoice} = ContentTypes
export const StepContentTypes = [
    { kind: 'Prompt', editable: Text.editable, render: Text.render },
    { kind: 'Question', editable: Text.editable, render: Text.render },
    { kind: 'Response', ...Response },
    { kind: 'Multiple choice answer', ...MultipleChoice },
    { kind: 'Check answer', ...CheckAnswer },
    { kind: 'Image', ...Image },
    { kind: 'Array', ...ArrayType },
    { kind: 'Numberline', ...Numberline },
]


export function applyEventsToLayoutContent(layoutContent, events){
    if (events && events.current){
        var updatedLayoutContent = extend({}, layoutContent)

        events[events.current] && events[events.current].click.forEach(change => {
            if (change.prop === 'layoutContent'){
                if (change.op === 'remove'){
                    delete updatedLayoutContent[change.id]
                } else if (['edit', 'add'].indexOf(change.op) !== -1){
                    updatedLayoutContent[change.id] = {
                        ...updatedLayoutContent[change.id], ...change.value
                    }
                }
            }
        })

        return updatedLayoutContent
    }

    return layoutContent
}

export const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-black mx-auto" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>


const slateHost = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://slate-eta.vercel.app'


export function useResponse(stepID){
    const [response, setResponse] = useState({})
    const responseRef = useRef(response)

    var processIframeData = function(event){
        if (event.origin === slateHost){
            var eventResponses = {}

            // Determine which content it is coming from.
            var iframes = document.getElementsByTagName('iframe'), i = 0,
                contentName
            for (i = 0; i < iframes.length; i++){
                if (event.source === iframes[i].contentWindow){
                    var parent = iframes[i].parentNode
                    while (!contentName && parent !== document.body){
                        contentName = parent.dataset.contentname
                        parent = parent.parentNode
                    }
                    break
                }
            }

            event.data?.data.forEach(
                pieceOfData => eventResponses[`{${contentName}}.${pieceOfData.id}`] = pieceOfData.value)

            responseRef.current = { ...responseRef.current, [stepID]: {
                ...(responseRef.current[stepID] || {}), ...eventResponses }
            }
            setResponse(responseRef.current)
        }
    }

    useEffect(() => {
        if (stepID){
            window.addEventListener('message', processIframeData);

            return () => {
                window.removeEventListener('message', processIframeData);
            }
        }
    }, [stepID])

    return [response, setResponse]
}
