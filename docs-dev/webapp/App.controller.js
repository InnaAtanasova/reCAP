sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/base/security/URLListValidator",
        "sap/ui/core/Fragment",
        "sap/ui/core/ComponentSupport",
    ],
    (Controller, JSONModel, URLListValidator, Fragment) => {
        return Controller.extend("recap.App", {
            isItTimeYet() {
                // return new Date() > new Date(2023, 3, 27, 16, 0, 0)
                return true
            },
            toSpeaker(oEvent) {
                if (
                    oEvent.getParameter("isTo") &&
                    oEvent.getParameter("navOrigin")
                ) {
                    const [_, firstName, lastName] = oEvent.getParameter("navOrigin").getText().split(" ")
                    /** @type {Map} */ const speakers =  this.getView().getModel("speakers")
                    const speaker = speakers.get(`${firstName} ${lastName}`)
                    console.log(speaker)
                    this.getView().setModel(new JSONModel(speaker), "speaker")
                }
            },
            onCloseDialog() {
                this.sessionDialog.then((sessionDialog) =>
                    sessionDialog.close()
                )
            },
            onAppointmentSelect(oEvent) {
                const appointment = oEvent.getParameter("appointment")
                const session = oEvent
                    .getParameter("appointment")
                    .getBindingContext("agenda")
                    .getObject()
                const sessionModel = new JSONModel(session)
                console.log(session)
                if (!this.sessionDialog) {
                    const view = this.getView()
                    this.sessionDialog = Fragment.load({
                        id: view.getId(),
                        name: "recap.SessionDialog",
                        controller: this,
                    }).then(function (sessionDialog) {
                        view.addDependent(sessionDialog)
                        return sessionDialog
                    })
                }
                this.sessionDialog.then((sessionDialog) => {
                    sessionDialog.setModel(sessionModel)
                    sessionDialog.openBy(appointment)
                })
            },
            async doAgenda() {
                const year = 2023
                const month = 6
                const day = 7
                const agendaModel = new JSONModel({
                    startDate: new Date(year, month, day, 9, 0, 0),
                })
                const speakerModel = new Map()

                const sessions = await fetch(
                    "https://recap.cfapps.eu12.hana.ondemand.com/api/proposal/lineup"
                ).then((r) => r.json())

                function makeDescriptive(room) {
                    let hrRoom = ""
                    switch (room) {
                        case "audimax":
                            hrRoom = "Audimax"
                            break
                        case "w1":
                            hrRoom = "Separé 1"
                            break
                        case "w2":
                            hrRoom = "Separé 2"
                            break
                        case "w3":
                            hrRoom = "Workshop"
                            break
                        case "meet_experts":
                            hrRoom = "Experts Corner 1"
                            break
                        case "meet_experts_2":
                            hrRoom = "Experts Corner 2"
                            break
                        default:
                            hrRoom = room
                            break
                    }
                    return hrRoom
                }

                function massage(session) {
                    const _session = { ...session }
                    const [startHour, startMinute] =
                        session.startTime.split(":")
                    _session.startTime = new Date(
                        year,
                        month,
                        day,
                        startHour,
                        startMinute
                    )
                    const [endHour, endMinute] = session.endTime.split(":")
                    _session.endTime = new Date(
                        year,
                        month,
                        day,
                        endHour,
                        endMinute
                    )
                    _session.startHour = startHour
                    _session.startMinute = startMinute
                    _session.endHour = endHour
                    _session.endMinute = endMinute
                    _session.speakers = _session.speakers.map((s) => {
                        const speaker = {...s}
                        speaker.photoUrl = `https://recap.cfapps.eu12.hana.ondemand.com${s.photoUrl}`
                        speakerModel.set(`${s.firstName} ${s.lastName}`, speaker)
                        return speaker
                    })
                    return _session
                }

                const byRooms = []
                const r = sessions.reduce((acc, session) => {
                    session.location = makeDescriptive(session.location)
                    if (!acc[session.location]) {
                        acc[session.location] = {
                            name: session.location,
                            sessions: [],
                        }
                    }
                    acc[session.location].sessions.push(massage(session))
                    return acc
                }, {})
                for (const room in r) {
                    byRooms.push(r[room])
                }

                agendaModel.setProperty("/rooms", byRooms)
                this.getView().setModel(agendaModel, "agenda")
                this.getView().setModel(speakerModel, "speakers")
            },
            onInit() {
                URLListValidator.add("mailto")
                URLListValidator.add("https")
                URLListValidator.add("data")
                const oModel = new JSONModel({
                    tickets: `<p>🔥 Get'em while they're hot! 🔥<br> &rarr; <a href="https://ti.to/ui5con-and-recap/ui5con-and-recap-2023">https://ti.to/ui5con-and-recap/ui5con-and-recap-2023</a></p>`,
                    sponsors: `
                    <p class="copyt">these packages are available:</p>
                    <ul class="copyt">
                    <li><span class="platin">Platin</span> - from 2000€, up to 4000€ or more:<br>4 conference tickets, mention on website, agenda, slides, blogs, social media and the possibility for an own booth onsite / own session at the event</li>
                    <li><span class="gold">Gold</span> - from 1000€, up to 2000€:<br>2 conference tickets, mention on website, agenda, slides, blogs, social media</li>
                    <li><span class="silver">Silver</span> - from 500 to 1000€:<br>1 conference ticket, mention on website</li>
                    </ul>
                    <p class="copyt contact"><a href="mailto:recap.conf@gmail.com">drop a line</a> to get in touch, friend!</p>`,
                    cfp: `🤗 thanks for handing in all 'em proposals!<br>🤖 crunching the agenda now...`,
                    where: `<p>Our friends from <a href="https://openui5.org/ui5con/germany2023/">UI5con</a> rock their event on the sandwich 🥪 day, July 6.</p><p>So you &#x1FAF5; can get the full stack conference experience, back to back.</p>`,
                    when: `<a href="https://www.google.com/calendar/render?action=TEMPLATE&text=reCAP%202023&dates=20230707T070000Z/20230707T150000Z&location=SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)&details=Dear%20CAP%20community,%20%3Cbr%3E%3Cbr%3E%20This%20year%E2%80%99s%20reCAP%20(un)conference%20will%20be%20an%20in-person%20event,%20taking%20place%20in%20St.%20Leon-Rot/Germany.%3Cbr%3E%3Cbr%3E%20This%20is%20the%20most%20important%20event%20of%20the%20year%20for%20developers,%20customers,%20partners%20working%20with%20CAP.%20Interesting%20sessions%20held%20by%20the%20CAP%20product%20team%20as%20well%20as%20the%20CAP%20community%20will%20shed%20light%20on%20a%20variety%20of%20topics.%20On%20top%20of%20this,%20you%20will%20meet%20friends%20you%20didn't%20see%20for%20a%20while,%20get%20to%20know%20new%20people%20from%20the%20community%20and%20enjoy%20a%20great%20party%20in%20the%20evening%20event%20(already%20on%206th%20of%20July%20together%20with%20the%20UI5con).%3Cbr%3E%3Cbr%3E%20Please%20save%20the%20following%20details:%3Cbr%3E%3Cbr%3E%20Date:%2007/07/2023%20--%3E%20the%20evening%20event%20will%20already%20take%20place%20on%20the%206th%20of%20July%20together%20with%20our%20UI5con%20friends%3Cbr%3E%3Cbr%3E%20Location:%20SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)%3Cbr%3E%3Cbr%3E%20Note%20that%20seats%20are%20limited,%20and%20registration%20is%20needed%20to%20be%20able%20to%20take%20part%20in%20this%20event!%20The%20registration%20process%20will%20open%20in%20April.%20For%20more%20details,%20please%20visit:%3Cbr%3E%3Cbr%3E-%20%3Ca%20href=%22https://recap-conf.dev/%22%20target=%22_blank%22%3EConference%20landing%20page%3C/a%3E%20%20%3Cbr%3E%3Cbr%3E-%20Propose%20your%20session%20%3Ca%20href=%22https://recap.cfapps.eu12.hana.ondemand.com/%22%20target=%22_blank%22%3Ehere%3C/a%3E%3Cbr%3E%3Cbr%3EThe%20reCAP%20Orga%20Team%20%3Cbr%3E%3Cbr%3EPS:%20Check-out%20the%20%3Ca%20href=%22https://openui5.org/ui5con/germany2023/%22%20target=%22_blank%22%3EUI5con%202023%3C/a%3E%20which%20takes%20place%20one%20day%20before%20reCAP%20at%20the%20same%20location!&sprop=&sprop=name:" target="_blank">Google</a> | 
                    <a href="https://outlook.office365.com/owa/?path=/calendar/action/compose&rru=addevent&subject=reCAP%202023&startdt=2023-07-07T07:00:00.000Z&enddt=2023-07-07T15:00:00.000Z&location=SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)&body=Dear%20CAP%20community,%20%3Cbr%3E%3Cbr%3E%20This%20year%E2%80%99s%20reCAP%20(un)conference%20will%20be%20an%20in-person%20event,%20taking%20place%20in%20St.%20Leon-Rot/Germany.%3Cbr%3E%3Cbr%3E%20This%20is%20the%20most%20important%20event%20of%20the%20year%20for%20developers,%20customers,%20partners%20working%20with%20CAP.%20Interesting%20sessions%20held%20by%20the%20CAP%20product%20team%20as%20well%20as%20the%20CAP%20community%20will%20shed%20light%20on%20a%20variety%20of%20topics.%20On%20top%20of%20this,%20you%20will%20meet%20friends%20you%20didn't%20see%20for%20a%20while,%20get%20to%20know%20new%20people%20from%20the%20community%20and%20enjoy%20a%20great%20party%20in%20the%20evening%20event%20(already%20on%206th%20of%20July%20together%20with%20the%20UI5con).%3Cbr%3E%3Cbr%3E%20Please%20save%20the%20following%20details:%3Cbr%3E%3Cbr%3E%20Date:%2007/07/2023%20--%3E%20the%20evening%20event%20will%20already%20take%20place%20on%20the%206th%20of%20July%20together%20with%20our%20UI5con%20friends%3Cbr%3E%3Cbr%3E%20Location:%20SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)%3Cbr%3E%3Cbr%3E%20Note%20that%20seats%20are%20limited,%20and%20registration%20is%20needed%20to%20be%20able%20to%20take%20part%20in%20this%20event!%20The%20registration%20process%20will%20open%20in%20April.%20For%20more%20details,%20please%20visit:%3Cbr%3E%3Cbr%3E-%20%3Ca%20href=%22https://recap-conf.dev/%22%20target=%22_blank%22%3EConference%20landing%20page%3C/a%3E%20%20%3Cbr%3E%3Cbr%3E-%20Propose%20your%20session%20%3Ca%20href=%22https://recap.cfapps.eu12.hana.ondemand.com/%22%20target=%22_blank%22%3Ehere%3C/a%3E%3Cbr%3E%3Cbr%3EThe%20reCAP%20Orga%20Team%20%3Cbr%3E%3Cbr%3EPS:%20Check-out%20the%20%3Ca%20href=%22https://openui5.org/ui5con/germany2023/%22%20target=%22_blank%22%3EUI5con%202023%3C/a%3E%20which%20takes%20place%20one%20day%20before%20reCAP%20at%20the%20same%20location!" target="_blank">Office 365</a> |
                    <a href="data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:20230707T070000Z%0ADTEND:20230707T150000Z%0ASUMMARY:reCAP%202023%0ALOCATION:SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)%0ADESCRIPTION:Dear%20CAP%20community,%20%5Cn%5CnThis%20year%E2%80%99s%20reCAP%20(un)conference%20will%20be%20an%20in-person%20event,%20taking%20place%20in%20St.%20Leon-Rot/Germany.%5Cn%5CnThis%20is%20the%20most%20important%20event%20of%20the%20year%20for%20developers,%20customers,%20partners%20working%20with%20CAP.%20Interesting%20sessions%20held%20by%20the%20CAP%20product%20team%20as%20well%20as%20the%20CAP%20community%20will%20shed%20light%20on%20a%20variety%20of%20topics.%20On%20top%20of%20this,%20you%20will%20meet%20friends%20you%20didn't%20see%20for%20a%20while,%20get%20to%20know%20new%20people%20from%20the%20community%20and%20enjoy%20a%20great%20party%20in%20the%20evening%20event%20(already%20on%206th%20of%20July%20together%20with%20the%20UI5con).%5Cn%5Cn%20Please%20save%20the%20following%20details:%5Cn%5Cn%20Date:%2007/07/2023%20--%3E%20the%20evening%20event%20will%20already%20take%20place%20on%20the%206th%20of%20July%20together%20with%20our%20UI5con%20friends%5Cn%5Cn%20Location:%20SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)%5Cn%5Cn%20Note%20that%20seats%20are%20limited,%20and%20registration%20is%20needed%20to%20be%20able%20to%20take%20part%20in%20this%20event!%20The%20registration%20process%20will%20open%20in%20April.%20For%20more%20details,%20please%20visit:%5Cn%5Cn-%20Conference%20landing%20page%20https://recap-conf.dev/%20%5Cn%5Cn-%20Propose%20your%20session%20here:%20https://recap.cfapps.eu12.hana.ondemand.com/%20%5Cn%5CnThe%20reCAP%20Orga%20Team%20%5Cn%5CnPS:%20Check-out%20the%20UI5con%202023%20which%20takes%20place%20one%20day%20before%20reCAP%20at%20the%20same%20location!%20https://openui5.org/ui5con/germany2023/%0AUID:1%0AEND:VEVENT%0AEND:VCALENDAR" download="reCAP2023.ics">Outlook</a> | 
                    <a href="data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:20230707T070000Z%0ADTEND:20230707T150000Z%0ASUMMARY:reCAP%202023%0ALOCATION:SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)%0ADESCRIPTION:Dear%20CAP%20community,%20%5Cn%5CnThis%20year%E2%80%99s%20reCAP%20(un)conference%20will%20be%20an%20in-person%20event,%20taking%20place%20in%20St.%20Leon-Rot/Germany.%5Cn%5CnThis%20is%20the%20most%20important%20event%20of%20the%20year%20for%20developers,%20customers,%20partners%20working%20with%20CAP.%20Interesting%20sessions%20held%20by%20the%20CAP%20product%20team%20as%20well%20as%20the%20CAP%20community%20will%20shed%20light%20on%20a%20variety%20of%20topics.%20On%20top%20of%20this,%20you%20will%20meet%20friends%20you%20didn't%20see%20for%20a%20while,%20get%20to%20know%20new%20people%20from%20the%20community%20and%20enjoy%20a%20great%20party%20in%20the%20evening%20event%20(already%20on%206th%20of%20July%20together%20with%20the%20UI5con).%5Cn%5Cn%20Please%20save%20the%20following%20details:%5Cn%5Cn%20Date:%2007/07/2023%20--%3E%20the%20evening%20event%20will%20already%20take%20place%20on%20the%206th%20of%20July%20together%20with%20our%20UI5con%20friends%5Cn%5Cn%20Location:%20SAP%20SE%20(ROT03),%20SAP-Allee%2027,%2068789%20St.%20Leon-Rot%20(Germany)%5Cn%5Cn%20Note%20that%20seats%20are%20limited,%20and%20registration%20is%20needed%20to%20be%20able%20to%20take%20part%20in%20this%20event!%20The%20registration%20process%20will%20open%20in%20April.%20For%20more%20details,%20please%20visit:%5Cn%5Cn-%20Conference%20landing%20page%20https://recap-conf.dev/%20%5Cn%5Cn-%20Propose%20your%20session%20here:%20https://recap.cfapps.eu12.hana.ondemand.com/%20%5Cn%5CnThe%20reCAP%20Orga%20Team%20%5Cn%5CnPS:%20Check-out%20the%20UI5con%202023%20which%20takes%20place%20one%20day%20before%20reCAP%20at%20the%20same%20location!%20https://openui5.org/ui5con/germany2023/%0AUID:1%0AEND:VEVENT%0AEND:VCALENDAR" download="reCAP2023.ics">iCal</a>`,
                })
                this.getView().setModel(oModel)
                this.doAgenda()
            },
        })
    }
)
